import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def get_engine():
    db_url = os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@localhost:5433/metallurgy_db"
    )
    if db_url.startswith("postgresql"):
        try:
            pg_engine = create_engine(
                db_url,
                connect_args={"connect_timeout": 2},
                pool_size=5,
                max_overflow=10,
                pool_pre_ping=True
            )
            with pg_engine.connect() as conn:
                return pg_engine
        except Exception:
            # PostgreSQL is offline, fallback to SQLite for reliable local operation
            return create_engine("sqlite:///./metallurgy.db", connect_args={"check_same_thread": False})
    elif db_url.startswith("sqlite"):
        return create_engine(db_url, connect_args={"check_same_thread": False})
    return create_engine(db_url, pool_size=10, max_overflow=20, pool_pre_ping=True)

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
