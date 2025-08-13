import psutil
import re
import os
import subprocess
from pathlib import Path

def detect_cpu_mining_processes():
    """Détecte les processus de mining CPU"""
    mining_processes = []
    
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'cmdline']):
        try:
            # Ignorer les processus système et non-mining
            system_processes = [
                'kernel', 'kthreadd', 'systemd', 'python', 'node', 'nginx', 'apache',
                'mysql', 'postgres', 'ssh', 'NetworkManager', 'dbus', 'cron'
            ]
            
            if proc.info['name'] in system_processes:
                continue
                
            # Critères spécifiques au mining CPU
            cpu_usage = proc.cpu_percent(interval=1)
            cmdline = ' '.join(proc.info['cmdline']) if proc.info['cmdline'] else ""
            
            is_cpu_miner = False
            
            # 1. CPU intensif (>70% pour CPU mining)
            if cpu_usage > 70:
                is_cpu_miner = True
                
            # 2. Keywords spécifiques CPU mining
            cpu_mining_keywords = [
                '--cpu', '--threads', '--algo', '--url', '--user',
                'stratum', 'mining', 'hashrate'
            ]
            
            if any(keyword in cmdline.lower() or keyword in proc.info['name'].lower() 
                   for keyword in cpu_mining_keywords):
                is_cpu_miner = True
            
            # 3. Processus utilisant tous les cores CPU
            if cpu_usage > 50 and proc.info['name'] not in ['stress', 'burnin']:
                # Vérifier si le processus utilise plusieurs threads
                try:
                    process = psutil.Process(proc.info['pid'])
                    if process.num_threads() >= psutil.cpu_count() // 2:
                        is_cpu_miner = True
                except:
                    pass
            
            if is_cpu_miner:
                mining_processes.append({
                    'pid': proc.info['pid'],
                    'name': proc.info['name'],
                    'cpu_percent': cpu_usage,
                    'memory_percent': proc.info['memory_percent'],
                    'cmdline': cmdline,
                    'threads': process.num_threads() if 'process' in locals() else 0
                })
                
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue
            
    return mining_processes

def find_cpu_mining_logs(process_info):
    """Trouve les logs spécifiques au mining CPU"""
    pid = process_info['pid']
    name = process_info['name']
    
    log_locations = []
    
    try:
        # 1. Fichiers ouverts par le processus
        proc = psutil.Process(pid)
        for file in proc.open_files():
            file_path = file.path.lower()
            if (any(ext in file_path for ext in ['.log', '.txt', '.out']) or
                any(keyword in file_path for keyword in ['mine', 'hash', 'cpu'])):
                log_locations.append(file.path)
        
        # 2. Logs dans les répertoires de l'utilisateur du processus
        try:
            user_home = proc.environ().get('HOME', '/tmp')
            search_dirs = [
                user_home,
                '/tmp',
                '/var/log',
                f'/home/{proc.username()}' if hasattr(proc, 'username') else None
            ]
        except:
            search_dirs = ['/tmp', '/var/log']
        
        search_dirs = [d for d in search_dirs if d and os.path.exists(d)]
        
        for search_dir in search_dirs[:2]:  # Limiter la recherche
            try:
                for root, dirs, files in os.walk(search_dir):
                    # Éviter les répertoires trop profonds
                    if root.count('/') > search_dir.count('/') + 2:
                        continue
                        
                    for file in files:
                        file_lower = file.lower()
                        if (name.lower() in file_lower or 
                            any(keyword in file_lower for keyword in ['mine', 'hash', 'xmrig', 'cpu', 'miner'])):
                            log_locations.append(os.path.join(root, file))
                            if len(log_locations) > 5:  # Limiter le nombre de logs
                                break
                    if len(log_locations) > 5:
                        break
            except (PermissionError, OSError):
                continue
                            
    except Exception as e:
        print(f"Erreur lors de la recherche de logs CPU: {e}")
    
    return list(set(log_locations))[:5]  # Max 5 logs uniques

def parse_cpu_hashrate_from_logs(log_files):
    """Parse le hashrate CPU depuis les fichiers de log"""
    cpu_hashrate_patterns = [
        # Patterns spécifiques CPU mining
        r'(\d+(?:\.\d+)?)\s*H/s',
        r'(\d+(?:\.\d+)?)\s*KH/s',
        r'(\d+(?:\.\d+)?)\s*MH/s',
        r'speed[:\s]*(\d+(?:\.\d+)?)\s*(H/s|KH/s|MH/s)',
        r'hashrate[:\s]*(\d+(?:\.\d+)?)\s*(H/s|KH/s|MH/s)',
        r'CPU[:\s]*(\d+(?:\.\d+)?)\s*(H/s|KH/s|MH/s)',
    ]
    
    latest_hashrate = None
    additional_stats = {
        'accepted_shares': None,
        'rejected_shares': None,
        'temp': None
    }
    
    for log_file in log_files:
        try:
            # Lire les 50 dernières lignes pour CPU mining
            with open(log_file, 'r', errors='ignore') as f:
                lines = f.readlines()[-50:]
                
            for line in reversed(lines):
                # Chercher hashrate
                if not latest_hashrate:
                    for pattern in cpu_hashrate_patterns:
                        match = re.search(pattern, line, re.IGNORECASE)
                        if match:
                            try:
                                if len(match.groups()) >= 2:
                                    value = float(match.group(1))
                                    unit = match.group(2).upper()
                                else:
                                    value = float(match.group(1))
                                    # Déterminer l'unité depuis le contexte
                                    if 'KH/s' in line.upper():
                                        unit = 'KH/S'
                                    elif 'MH/s' in line.upper():
                                        unit = 'MH/S'
                                    else:
                                        unit = 'H/S'
                                
                                # Convertir en H/s
                                multipliers = {'H/S': 1, 'KH/S': 1000, 'MH/S': 1000000}
                                latest_hashrate = value * multipliers.get(unit, 1)
                                break
                            except (ValueError, IndexError):
                                continue
                
                # Chercher shares acceptées
                if 'accepted' in line.lower() and not additional_stats['accepted_shares']:
                    share_match = re.search(r'accepted[:\s]*(\d+)', line, re.IGNORECASE)
                    if share_match:
                        additional_stats['accepted_shares'] = int(share_match.group(1))
                
                if latest_hashrate:
                    break
                    
        except Exception as e:
            print(f"Erreur lecture log CPU {log_file}: {e}")
            continue
    
    return latest_hashrate, additional_stats

def get_cpu_mining_stats():
    """Fonction principale pour obtenir les stats de mining CPU"""
    cpu_mining_processes = detect_cpu_mining_processes()
    
    if not cpu_mining_processes:
        return None
    
    total_cpu_hashrate = 0
    mining_data = []
    
    for proc in cpu_mining_processes:
        # Chercher les logs
        log_files = find_cpu_mining_logs(proc)
        
        # Parser le hashrate CPU
        hashrate, additional_stats = parse_cpu_hashrate_from_logs(log_files)
        
        mining_data.append({
            'process': proc['name'],
            'pid': proc['pid'],
            'cpu_percent': proc['cpu_percent'],
            'threads': proc['threads'],
            'hashrate': hashrate,
            'accepted_shares': additional_stats.get('accepted_shares'),
            'log_files': [os.path.basename(f) for f in log_files[:2]]  # Juste les noms
        })
        
        if hashrate:
            total_cpu_hashrate += hashrate
    
    return {
        'total_cpu_hashrate': total_cpu_hashrate,
        'cpu_miners': mining_data,
        'active_cpu_miners': len([m for m in mining_data if m['hashrate']]),
        'total_cpu_usage': sum(proc['cpu_percent'] for proc in cpu_mining_processes)
    }