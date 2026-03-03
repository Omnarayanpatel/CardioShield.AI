import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

def _normalized_database_url() -> str:
    raw = os.getenv("DATABASE_URL", "sqlite:///./cardioshield.db")
    if not raw:
        return "sqlite:///./cardioshield.db"

    value = raw.strip().strip('"').strip("'")
    # Compatibility fallback used by some providers/tools.
    if value.startswith("postgres://"):
        value = value.replace("postgres://", "postgresql://", 1)
    return value


DATABASE_URL = _normalized_database_url()

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()
