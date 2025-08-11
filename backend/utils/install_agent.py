#!/usr/bin/env python3

import sys
import os
import subprocess
import paramiko
import argparse
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

def generate_ssh_key():
    """Génère une clé SSH RSA si elle n'existe pas"""
    ssh_dir = Path.home() / ".ssh"
    ssh_key_path = ssh_dir / "id_rsa"
    
    if ssh_key_path.exists():
        logger.info("Clé SSH existante trouvée")
        return str(ssh_key_path)
    
    logger.info("Génération d'une nouvelle clé SSH...")
    ssh_dir.mkdir(mode=0o700, exist_ok=True)
    
    try:
        key = paramiko.RSAKey.generate(4096)
        key.write_private_key_file(str(ssh_key_path))
        
        pub_key_path = ssh_dir / "id_rsa.pub"
        with open(pub_key_path, 'w') as f:
            f.write(f"ssh-rsa {key.get_base64()} mineops@{os.uname().nodename}\n")
        
        ssh_key_path.chmod(0o600)
        pub_key_path.chmod(0o644)
        
        logger.info("Clé SSH générée avec succès")
        return str(ssh_key_path)
    except Exception as e:
        logger.error(f"Erreur lors de la génération de la clé SSH: {e}")
        sys.exit(1)

def setup_ssh_connection(ip, user, password):
    """Configure la connexion SSH et copie la clé publique"""
    logger.info(f"Configuration SSH pour {user}@{ip}...")
    
    try:
        ssh = paramiko.SSHClient()
        # Cette ligne accepte automatiquement les nouvelles clés d'hôte
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # Debug : test de connectivité réseau d'abord
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((ip, 22))
        sock.close()
        
        if result != 0:
            logger.error(f"Impossible d'atteindre {ip}:22")
            return False
        
        logger.info(f"Port 22 accessible sur {ip}")
        
        # Tentative de connexion avec password
        logger.info(f"Tentative de connexion avec mot de passe...")
        ssh.connect(
            ip, 
            username=user, 
            password=password, 
            timeout=30,
            allow_agent=False,      # Désactiver l'agent SSH
            look_for_keys=False,    # Ne pas chercher les clés existantes
            # Ajouter ces options pour accepter automatiquement les host keys
            disabled_algorithms={'pubkeys': ['rsa-sha2-256', 'rsa-sha2-512']}
        )
        
        logger.info("Connexion SSH réussie avec mot de passe")
        
        pub_key_path = Path.home() / ".ssh" / "id_rsa.pub"
        with open(pub_key_path, 'r') as f:
            public_key = f.read().strip()
        
        commands = [
            "mkdir -p ~/.ssh",
            "chmod 700 ~/.ssh",
            f"echo '{public_key}' >> ~/.ssh/authorized_keys",
            "chmod 600 ~/.ssh/authorized_keys",
            "sort ~/.ssh/authorized_keys | uniq > ~/.ssh/authorized_keys.tmp",
            "mv ~/.ssh/authorized_keys.tmp ~/.ssh/authorized_keys"
        ]
        
        for cmd in commands:
            stdin, stdout, stderr = ssh.exec_command(cmd)
            exit_status = stdout.channel.recv_exit_status()
            if exit_status != 0:
                logger.error(f"Erreur lors de l'exécution de: {cmd}")
                return False
        
        ssh.close()
        logger.info("Clé SSH configurée avec succès")
        return True
        
    except paramiko.AuthenticationException as e:
        logger.error(f"Erreur d'authentification: {e}")
        logger.error(f"Vérifiez le nom d'utilisateur '{user}' et le mot de passe pour {ip}")
        return False
    except paramiko.SSHException as e:
        logger.error(f"Erreur SSH: {e}")
        return False
    except Exception as e:
        logger.error(f"Erreur lors de la configuration SSH: {e}")
        return False

def test_ssh_key_connection(ip, user):
    """Test la connexion SSH avec la clé privée"""
    logger.info(f"Test de la connexion SSH avec clé vers {user}@{ip}...")
    
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        key_path = Path.home() / ".ssh" / "id_rsa"
        private_key = paramiko.RSAKey.from_private_key_file(str(key_path))
        
        ssh.connect(ip, username=user, pkey=private_key, timeout=10)
        
        # Test
        stdin, stdout, stderr = ssh.exec_command("echo 'Connexion SSH avec clé réussie !'")
        result = stdout.read().decode().strip()
        
        ssh.close()
        logger.info("Test de connexion SSH avec clé réussi")
        return True
        
    except Exception as e:
        logger.error(f"Erreur lors du test SSH avec clé: {e}")
        return False

def run_ansible_playbook(ip, user, backend_ip):
    """Exécute le playbook Ansible"""
    script_dir = Path(__file__).parent
    playbook_path = script_dir / "../playbook/deploy_agent.yml"
    
    if not playbook_path.exists():
        logger.error(f"Playbook non trouvé: {playbook_path}")
        return False
    
    logger.info("Exécution du playbook Ansible...")
    
    try:
        subprocess.run([
            "ansible-playbook", str(playbook_path),
            "-i", f"{ip},",
            "-u", user,
            "-e", "ansible_ssh_common_args='-o StrictHostKeyChecking=no'",
            "-e", f"backend_ip={backend_ip}"
        ], check=True)
        logger.info("Playbook Ansible exécuté avec succès")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Erreur lors de l'exécution du playbook: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Installation de l'agent MineOps sur une machine distante")
    parser.add_argument("ip", help="Adresse IP de la machine cible")
    parser.add_argument("user", help="Nom d'utilisateur pour la connexion SSH")
    parser.add_argument("password", help="Mot de passe pour la connexion SSH")
    
    args = parser.parse_args()
    
    # Debug : afficher toutes les variables d'environnement
    logger.info("Variables d'environnement disponibles :")
    for key, value in os.environ.items():
        if 'HOST' in key or 'IP' in key:
            logger.info(f"  {key}={value}")
    
    # Récupérer l'IP du backend depuis la variable d'environnement
    backend_ip = os.environ.get("HOST_IP")
    if not backend_ip:
        logger.error("Variable HOST_IP non définie. L'IP du backend doit être fournie.")
        logger.error("Vérifiez que HOST_IP est bien définie dans docker-compose.yml")
        sys.exit(1)
    
    logger.info(f"IP du backend : {backend_ip}")
    logger.info(f"Début de l'installation sur {args.ip}")
    
    try:
        # 1. Générer la clé SSH si nécessaire
        generate_ssh_key()
        
        # 2. Configurer SSH et copier la clé
        if not setup_ssh_connection(args.ip, args.user, args.password):
            logger.error("Échec de la configuration SSH")
            sys.exit(1)
        
        # 3. Tester la connexion SSH avec clé
        if not test_ssh_key_connection(args.ip, args.user):
            logger.error("Échec du test de connexion SSH avec clé")
            sys.exit(1)
        
        # 4. Exécuter le playbook Ansible avec l'IP du backend
        if not run_ansible_playbook(args.ip, args.user, backend_ip):
            logger.error("Échec de l'exécution du playbook")
            sys.exit(1)
        
        logger.info(f"Installation terminée avec succès sur {args.ip}")
        
    except KeyboardInterrupt:
        logger.warning("Installation interrompue par l'utilisateur")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Erreur inattendue: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()