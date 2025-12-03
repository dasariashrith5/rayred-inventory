

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Use SQLite for cloud deployment (free tier friendly)
database_url = os.getenv("DATABASE_URL", "sqlite:///./rayred.db")

# Handle Render's PostgreSQL-style URL format
if database_url and database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg2://")

print(f"📍 Using database: {database_url}")

try:
    if "sqlite" in database_url:
        engine = create_engine(
            database_url,
            connect_args={"check_same_thread": False}
        )
    else:
        engine = create_engine(database_url)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    print("✅ Database engine created successfully")
except Exception as e:
    print(f"❌ Database connection error: {e}")
    raise

