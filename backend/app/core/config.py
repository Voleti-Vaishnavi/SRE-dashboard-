from pathlib import Path

from pydantic_settings import BaseSettings

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BACKEND_DIR / "data"
MOCK_EXCEL_DIR = DATA_DIR / "mock_excel"


class Settings(BaseSettings):
    app_name: str = "SRE Dashboard API"
    database_url: str = f"sqlite:///{(DATA_DIR / 'sre_dashboard.db').as_posix()}"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


settings = Settings()

DATA_DIR.mkdir(parents=True, exist_ok=True)
MOCK_EXCEL_DIR.mkdir(parents=True, exist_ok=True)
