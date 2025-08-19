import asyncio
import paramiko
import threading
import uuid
import json
from datetime import datetime, timezone
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class SSHSession:
    def __init__(self, hostname: str, ip_address: str, user: str):
        self.session_id = str(uuid.uuid4())
        self.hostname = hostname
        self.ip_address = ip_address
        self.user = user
        self.ssh_client = None
        self.shell_channel = None
        self.created_at = datetime.now(timezone.utc)
        self.last_used = datetime.now(timezone.utc)
        self.status = "connecting"
        self.websocket = None
        self.read_task = None

    async def connect(self):
        """Établit la connexion SSH avec PTY"""
        try:
            self.ssh_client = paramiko.SSHClient()
            self.ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            # Connexion SSH
            self.ssh_client.connect(
                hostname=self.ip_address,
                username=self.user,
                timeout=10,
                look_for_keys=True,
                allow_agent=True
            )
            
            # Créer un canal shell interactif avec PTY
            self.shell_channel = self.ssh_client.invoke_shell(
                term='xterm-256color',
                width=120,
                height=30
            )
            
            # Configurer le terminal
            self.shell_channel.settimeout(0.1)
            
            # Attendre un peu que le shell soit prêt
            await asyncio.sleep(0.5)
            
            # Vider le buffer initial (message de connexion, prompt, etc.)
            try:
                while self.shell_channel.recv_ready():
                    initial_data = self.shell_channel.recv(4096).decode('utf-8', errors='ignore')
                    logger.info(f"Initial shell output: {repr(initial_data)}")
            except:
                pass
            
            self.status = "connected"
            logger.info(f"SSH session {self.session_id[:8]}... connected to {self.ip_address}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect SSH session: {e}")
            self.status = "failed"
            return False

    async def send_command(self, command: str):
        """Envoie une commande au shell"""
        if self.shell_channel and self.shell_channel.send_ready():
            try:
                # Logger pour debug
                logger.info(f"Sending command to SSH session {self.session_id[:8]}...: {repr(command)}")
                
                # Envoyer la commande
                bytes_sent = self.shell_channel.send(command.encode('utf-8'))
                logger.info(f"Command sent: {bytes_sent} bytes")
                
                self.last_used = datetime.now(timezone.utc)
                
                # Forcer la lecture immédiate pour voir s'il y a une réponse
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Error sending SSH command: {e}")
        else:
            logger.warning(f"SSH channel not ready for session {self.session_id[:8]}... (send_ready: {self.shell_channel.send_ready() if self.shell_channel else 'No channel'})")

    async def read_output(self):
        """Lit la sortie du shell en continu"""
        logger.info(f"Starting SSH output reader for session {self.session_id[:8]}...")
        
        while self.status == "connected" and self.shell_channel:
            try:
                if self.shell_channel.recv_ready():
                    data = self.shell_channel.recv(4096).decode('utf-8', errors='ignore')
                    logger.info(f"SSH output received ({len(data)} chars): {repr(data[:100])}")
                    
                    if self.websocket:
                        try:
                            # Envoyer en format JSON pour cohérence
                            await self.websocket.send_text(json.dumps({
                                "type": "output",
                                "data": data
                            }))
                            logger.info(f"SSH output sent to WebSocket")
                        except Exception as ws_error:
                            logger.error(f"Error sending WebSocket message: {ws_error}")
                            break
                    else:
                        logger.warning(f"No WebSocket available to send output")
                        
                await asyncio.sleep(0.01)
            except Exception as e:
                logger.error(f"Error reading SSH output: {e}")
                break
                
        logger.info(f"SSH output reader stopped for session {self.session_id[:8]}...")

    def resize_terminal(self, width: int, height: int):
        """Redimensionne le terminal"""
        if self.shell_channel:
            self.shell_channel.resize_pty(width, height)

    def disconnect(self):
        """Ferme la session SSH"""
        self.status = "closed"
        
        if self.read_task:
            self.read_task.cancel()
            
        if self.shell_channel:
            self.shell_channel.close()
            
        if self.ssh_client:
            self.ssh_client.close()
            
        logger.info(f"SSH session {self.session_id[:8]}... disconnected")

class SSHManager:
    def __init__(self):
        self.sessions: Dict[str, SSHSession] = {}

    async def create_session(self, hostname: str, ip_address: str, user: str) -> Optional[SSHSession]:
        """Crée une nouvelle session SSH"""
        session = SSHSession(hostname, ip_address, user)
        
        if await session.connect():
            self.sessions[session.session_id] = session
            return session
        else:
            return None

    def get_session(self, session_id: str) -> Optional[SSHSession]:
        """Récupère une session existante"""
        return self.sessions.get(session_id)

    def close_session(self, session_id: str):
        """Ferme une session"""
        if session_id in self.sessions:
            self.sessions[session_id].disconnect()
            del self.sessions[session_id]

    def cleanup_old_sessions(self, max_age_hours: int = 2):
        """Nettoie les sessions anciennes"""
        from datetime import timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
        
        sessions_to_remove = []
        for session_id, session in self.sessions.items():
            if session.last_used < cutoff or session.status in ["closed", "failed"]:
                sessions_to_remove.append(session_id)
        
        for session_id in sessions_to_remove:
            self.close_session(session_id)
        
        return len(sessions_to_remove)

# Instance globale
ssh_manager = SSHManager()