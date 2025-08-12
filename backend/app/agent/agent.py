import requests
import psutil
import socket
from datetime import datetime, timedelta
import time
import os
import netifaces

def get_api_url():
    """Récupère l'URL de l'API depuis la variable d'environnement ou fallback"""
    env_url = os.environ.get("MINEOPS_API_URL")
    if env_url:
        return env_url
    return "http://localhost:8000/metrics"

def get_ip_address():
    try:
        for interface in netifaces.interfaces():
            if interface.startswith('lo'):  # Ignorer loopback
                continue
            
            addresses = netifaces.ifaddresses(interface)
            if netifaces.AF_INET in addresses:
                for addr_info in addresses[netifaces.AF_INET]:
                    ip = addr_info['addr']
                    
                    # Privilégier les plages IP privées (non NAT VirtualBox)
                    if (ip.startswith('192.168.') or 
                        ip.startswith('172.16.') or ip.startswith('172.17.') or 
                        ip.startswith('172.18.') or ip.startswith('172.19.') or
                        ip.startswith('172.2') or ip.startswith('172.3') or
                        (ip.startswith('10.') and not ip.startswith('10.0.2.'))):  # Éviter NAT VirtualBox
                        return ip
    except Exception as e:
        print(f"Erreur lors du scan des interfaces: {e}")

def get_uptime():
    try:
        boot_time = psutil.boot_time()
        current_time = datetime.now().timestamp()
        uptime_seconds = int(current_time - boot_time)
        
        days = uptime_seconds // 86400
        hours = (uptime_seconds % 86400) // 3600
        minutes = (uptime_seconds % 3600) // 60

        uptime_format = []
        if days > 0:
            uptime_format.append(f"{days} jour{'s' if days > 1 else ''}")
        if hours > 0:
            uptime_format.append(f"{hours} heure{'s' if hours > 1 else ''}")
        if minutes > 0:
            uptime_format.append(f"{minutes} minute{'s' if minutes > 1 else ''}")
        return ", ".join(uptime_format) if uptime_format else "moins d'une minute"
    except Exception as e:
        return f"Erreur: {e}"

def get_metrics():
    cpu_utilization = psutil.cpu_percent(interval=1)
    memory_utilization = psutil.virtual_memory().percent
    disk_usage = psutil.disk_usage('/').percent

    metrics = {
        "cpu_utilization": cpu_utilization,
        "memory_utilization": memory_utilization,
        "disk_usage": disk_usage,
        "ip_address": get_ip_address(),
        "hostname": socket.gethostname(),
        "last_seen": datetime.utcnow().isoformat(),
        "uptime": get_uptime()
    }
    return metrics

def send_metrics(metrics):
    try:
        response = requests.post(API_URL, json=metrics)
        print(f"Status: {response.status_code} - {response.text}")
    except Exception as e:
        print("Send error: ", e)

API_URL = get_api_url()
print(f"Using API URL: {API_URL}")

if __name__ == "__main__":
    while True:
        metrics = get_metrics()
        print("Envoi des metrics : ", metrics)
        send_metrics(metrics)
        time.sleep(30)