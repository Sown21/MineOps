import requests
import psutil
import socket
from datetime import datetime
import time
import netifaces

API_URL = "http://192.168.56.30:8000/metrics"

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
        "last_seen": datetime.utcnow().isoformat()
    }
    return metrics

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

def send_metrics(metrics):
    try:
        response = requests.post(API_URL, json=metrics)
        print(f"Status: {response.status_code} - {response.text}")
    except Exception as e:
        print("Send error: ", e)

if __name__ == "__main__":
    while True:
        metrics = get_metrics()
        print("Envoi des metrics : ", metrics)
        send_metrics(metrics)
        time.sleep(30)