from datetime import datetime
from pydantic import BaseModel, field_serializer


class MetricsIn(BaseModel):
    hostname: str
    ip_address: str
    cpu_utilization: float
    memory_utilization: float
    disk_usage: float
    last_seen: datetime
    uptime: str

class MetricsOut(BaseModel):
    id: int
    hostname: str
    ip_address: str
    cpu_utilization: float
    memory_utilization: float
    disk_usage: float
    last_seen: datetime
    uptime: str

    @field_serializer("last_seen")
    def serialize_last_seen(self, value: datetime, _info):
        return value.isoformat()

    class Config:
        from_attributes = True

class InstallMiner(BaseModel):
    ip_address: str
    user: str
    password: str