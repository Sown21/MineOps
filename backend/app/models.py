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