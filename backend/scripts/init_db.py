"""Create all database tables. Safe to re-run (no-op on existing tables)."""

from app import models  # noqa: F401  (ensures all models are registered on Base)
from app.core.database import Base, engine


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    print("Database tables created (or already exist).")


if __name__ == "__main__":
    init_db()
