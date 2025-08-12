from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from datetime import datetime

class Base(DeclarativeBase):
    pass

class MetricsDB(Base):
    __tablename__ = "metrics"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    hostname: Mapped[str] = mapped_column(index=True)
    ip_address: Mapped[str]
    cpu_utilization: Mapped[float]
    memory_utilization: Mapped[float]
    disk_usage: Mapped[float]
    last_seen: Mapped[datetime] = mapped_column(default=datetime)
    uptime: Mapped[str]

    def as_dict(self):
        return {
            "id": self.id,
            "hostname": self.hostname,
            "ip_address": self.ip_address,
            "cpu_utilization": self.cpu_utilization,
            "memory_utilization": self.memory_utilization,
            "disk_usage": self.disk_usage,
            "last_seen": self.last_seen,
            "uptime": self.uptime,
        }