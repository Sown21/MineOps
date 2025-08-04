import requests
import psutil
import socket
from datetime import datetime
import time
import ipaddress

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
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))  # Connect to a public DNS server (Google's)
    local_ip = s.getsockname()[0]
    s.close()
    return local_ip
  except socket.error:
    return "127.0.0.1"

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