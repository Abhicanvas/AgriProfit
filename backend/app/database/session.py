from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import os
import re

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://agriprofit:agriprofit@localhost:5432/agriprofit",
)

# Debug logging: show DATABASE_URL with password masked
_masked_url = re.sub(r'://[^:]+:[^@]+@', '://***:***@', DATABASE_URL)
print(f"[DB] Connecting to: {_masked_url}")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

def get_db() -> Session:
    """
    FastAPI dependency that provides a DB session
    and ensures proper cleanup.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
