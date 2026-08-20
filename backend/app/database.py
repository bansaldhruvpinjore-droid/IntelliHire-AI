import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


# --------------------------------------------------
# 1. Find the IntelliHire-AI project directory
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]


# --------------------------------------------------
# 2. Load environment variables from .env
# --------------------------------------------------

load_dotenv(BASE_DIR / ".env")


# --------------------------------------------------
# 3. Get Neon PostgreSQL connection URL
# --------------------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in .env")


# --------------------------------------------------
# 4. Create database engine
# --------------------------------------------------

engine = create_engine(
    DATABASE_URL.replace(
        "postgresql://",
        "postgresql+psycopg://",
        1
    ),
    pool_pre_ping=True
)


# --------------------------------------------------
# 5. Create database sessions
# --------------------------------------------------

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# --------------------------------------------------
# 6. Base class for database models
# --------------------------------------------------

Base = declarative_base()


# --------------------------------------------------
# 7. Database dependency for FastAPI
# --------------------------------------------------

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()