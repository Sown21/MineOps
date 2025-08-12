from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from app.database import SessionLocal
from app.schemas import MetricsIn, MetricsOut, InstallMiner
from app.models import MetricsDB
from sqlalchemy.orm import Session
from sqlalchemy import text, desc
from typing import List
import logging
from datetime import timedelta, datetime, timezone
import subprocess
import os
import json

app = FastAPI(title="Metrics MineOps", 
              description="API MineOps",
              openapi_tags=[
                  {"name": "Metrics", "description": "Gestion des métriques"},
                  {"name": "Maintenance", "description": "Nettoyage et maintenance de la base"},
                  {"name": "Health", "description": "Statut des agents"},
                  {"name": "Installation", "description": "Installation/Setup Machine"},
                  {"name": "Device state", "description": "Commande pour gérer l'état de la machine"},
              ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

mapping_file = "user_mapping.json"

def save_user_mapping(ip, user):
    if os.path.exists(mapping_file):
        with open(mapping_file, "r") as f:
            mapping = json.load(f)
    else:
        mapping = {}
    
    mapping[ip] = user

    with open(mapping_file, "w") as f:
        json.dump(mapping, f)

def get_user_for_ip(ip):
    if os.path.exists(mapping_file):
        with open(mapping_file, "r") as f:
            mapping = json.load(f)
        return mapping.get(ip)
    return None

@app.get("/metrics", response_model=List[MetricsOut], tags=["Metrics"])
def get_metrics(db: Session = Depends(get_db)):
    db_metrics = db.query(MetricsDB).all()
    if not db_metrics:
        raise HTTPException(status_code=404, detail="Métrique non trouvée")
    return db_metrics

@app.post("/metrics", response_model=MetricsIn, tags=["Metrics"])
def send_metrics(metrics: MetricsIn, db: Session = Depends(get_db)):
    db_metrics = MetricsDB(**metrics.model_dump())
    db.add(db_metrics)
    db.commit()
    db.refresh(db_metrics)
    return db_metrics

@app.get("/metrics/hostname/{hostname}", response_model=List[MetricsOut], tags=["Metrics"])
def get_metrics_by_hostname(hostname: str, db: Session = Depends(get_db)):
    db_metrics = db.query(MetricsDB).filter(MetricsDB.hostname == hostname).all()
    if not db_metrics:
        raise HTTPException(status_code=404, detail="Aucune metrique trouvée pour ce hostname")
    return db_metrics

@app.get("/metrics/latest/{hostname}", response_model=MetricsOut, tags=["Metrics"])
def get_latest_metrics_by_hostname(hostname: str, db: Session = Depends(get_db)):
    db_metrics = db.query(MetricsDB).filter(MetricsDB.hostname == hostname).order_by(MetricsDB.last_seen.desc()).first()
    if not db_metrics:
        raise HTTPException(status_code=404, detail="Aucune métrique trouvé pour ce hostname")
    return db_metrics

@app.get("/healthcheck/{hostname}", tags=["Health"])
def get_agent_health(hostname: str, db: Session = Depends(get_db)):
    current_time = datetime.now(timezone.utc)
    threshold = current_time - timedelta(minutes=2)
    latest_metric = db.query(MetricsDB).filter(MetricsDB.hostname == hostname).order_by(MetricsDB.last_seen.desc()).first()
    if not latest_metric:
        raise HTTPException(status_code=404, detail="Aucune métrique trouvée pour ce hostname")
    last_seen = latest_metric.last_seen
    if last_seen.tzinfo is None:
        last_seen = last_seen.replace(tzinfo=timezone.utc)
    status = "online" if last_seen > threshold else "offline"
    return {"hostname": hostname, "status": status, "last_seen": last_seen}

@app.post("/metrics/clean", tags=["Maintenance"])
def clean_db(months: int = Query(0, ge=0, description="Nombre de mois à garder (minimum 1)"), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=30 * months)
    deleted = db.query(MetricsDB).filter(MetricsDB.last_seen < cutoff).delete()
    db.commit()
    try:
        db.execute(text("VACUUM"))
        vacuum_status = "VACUUM exécuté avec succès"
    except Exception as e:
        vacuum_status = f"Erreur VACUUM: {e}"
    return {
        "deleted": deleted,
        "cutoff": cutoff.isoformat(),
        "vacuum": vacuum_status
    }

@app.post("/metrics/auto_clean", tags=["Maintenance"])
def auto_clean(db: Session = Depends(get_db)):
    oldest = db.query(MetricsDB).order_by(MetricsDB.last_seen.asc()).first()
    now = datetime.now(timezone.utc)
    age = now - oldest.last_seen
    if age.days > 365:
        cutoff = now - timedelta(days=30 * 6)
        deleted = db.query(MetricsDB).filter(MetricsDB.last_seen < cutoff).delete()
        db.commit()
        try:
            db.execute(text("VACUUM"))
            vacuum_status = "VACUUM exécuté avec succès"
        except Exception as e:
            vacuum_status = f"Erreur VACUUM: {e}"
        return {
            "deleted": deleted,
            "cutoff": cutoff.isoformat(),
            "vacuum": vacuum_status,
            "auto_clean": True
        }
    return {"status": "no_clean_needed", "oldest": oldest.last_seen.isoformat()}

@app.get("/metrics/history/{hostname}", tags=["Metrics"])
def get_metrics_history(
    hostname: str, 
    period: str = Query("6h", description="Période d'historique (1h, 6h, 12h, 24h)"),
    limit: int = Query(500, ge=50, le=1000, description="Nombre maximum de points"),
    db: Session = Depends(get_db)
):
    period_map = {
        "1h": 1,
        "6h": 6, 
        "12h": 12,
        "24h": 24
    }
    
    if period not in period_map:
        raise HTTPException(status_code=400, detail="Période invalide. Utilisez: 1h, 6h, 12h, 24h")
    
    hours = period_map[period]
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(hours=hours)

    metrics = (
        db.query(MetricsDB)
        .filter(MetricsDB.hostname == hostname)
        .filter(MetricsDB.last_seen >= start_time)
        .order_by(MetricsDB.last_seen.asc())
        .limit(limit)
        .all()
    )
    
    if not metrics:
        raise HTTPException(status_code=404, detail=f"Aucune métrique trouvée pour {hostname} sur les {hours}h")
    
    return {
        "hostname": hostname,
        "period": period,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "count": len(metrics),
        "metrics": [m.as_dict() for m in metrics]
    }

from fastapi import HTTPException

@app.post("/add-miner", tags=["Installation"])
async def add_miner(data: InstallMiner):
    ip = data.ip_address
    user = data.user
    password = data.password
    script_path = os.path.join(os.getcwd(), "utils/install_agent.py")
    result = subprocess.run(
        [script_path, ip, user, password],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print("STDERR:", result.stderr)
        print("STDOUT:", result.stdout)
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'installation : {result.stderr.strip() or result.stdout.strip()}"
        )
    save_user_mapping(ip, user)
    return {"output": result.stdout.strip()}

@app.post("/reboot/{ip_address}", tags=["Device state"])
async def reboot_device(ip_address: str):
    user = get_user_for_ip(ip_address) or "root"
    result = subprocess.run(
        [
            "ansible",
            ip_address,
            "-i", f"{ip_address},",
            "-m", "reboot",
            "-u", user,
            "--become"
        ],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print("STDERR:", result.stderr)
        print("STDOUT:", result.stdout)
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'execution de la commande reboot : {result.stderr.strip() or result.stdout.strip()}"
        )
    return {"ip": ip_address, "output": result.stdout.strip()}

@app.post("/execute-command", tags=["Commands"])
async def execute_command(request: dict):
    command = request.get("command")
    hostnames = request.get("hostnames", [])
    if not command or not hostnames:
        raise HTTPException(
            status_code=400, 
            detail="Command and hostnames are required"
        )
    results = []
    for hostname in hostnames:
        user = get_user_for_ip(hostname) or "root"
        try:
            result = subprocess.run([
                "ansible",
                hostname,
                "-i", f"{hostname},",
                "-m", "shell",
                "-a", command,
                "-u", user
            ], capture_output=True, text=True, timeout=30)
            
            results.append({
                "hostname": hostname,
                "success": result.returncode == 0,
                "output": result.stdout.strip() or result.stderr.strip(),
                "return_code": result.returncode
            })
            
        except subprocess.TimeoutExpired:
            results.append({
                "hostname": hostname,
                "success": False,
                "output": "Commande timeout (30s)",
                "return_code": -1
            })
        except Exception as e:
            results.append({
                "hostname": hostname,
                "success": False,
                "output": f"Erreur: {str(e)}",
                "return_code": -1
            })
    return {"results": results}

@app.get("/uptime/{hostname}", tags=["Health"])
def get_hostname_uptime(hostname: str, db: Session = Depends(get_db)):
    metrics = db.query(MetricsDB).filter(MetricsDB.hostname == hostname).order_by(MetricsDB.last_seen.desc()).first()
    if not metrics:
        raise HTTPException(status_code=404, detail=f"Aucune données pour {hostname}")
    return {"hostname": hostname, "uptime": metrics.uptime}
