from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base

engine = create_engine("sqlite:///./data/metrics.db")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Création des tables si elles n'existent pas
Base.metadata.create_all(bind=engine)