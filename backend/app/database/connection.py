import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

POSTGRES_DB = os.getenv("POSTGRES_DB", "urban_heat")
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

pg_url = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

# Absolute SQLite Path to prevent relative working-directory mismatches
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SQLITE_DB_PATH = os.path.join(BASE_DIR, "urban_heat.db").replace("\\", "/")
sqlite_url = f"sqlite:///{SQLITE_DB_PATH}"

# Database Engine Selection
engine = None
IS_POSTGRES = False

try:
    # Attempt Postgres connection with short timeout
    test_engine = create_engine(pg_url, connect_args={"connect_timeout": 2})
    with test_engine.connect() as conn:
        logger.info("Successfully connected to PostgreSQL/PostGIS database.")
    engine = test_engine
    IS_POSTGRES = True
except Exception as e:
    logger.info(f"PostgreSQL unavailable ({e}). Using local SQLite database at: {SQLITE_DB_PATH}")
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
    IS_POSTGRES = False

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from app.database.models import Base
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized.")
