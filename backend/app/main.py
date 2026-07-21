from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import analytics, applications, health, teams, templates, uploads
from app.core.config import DATA_DIR, settings

STATIC_DIR = Path(__file__).resolve().parent / "static"


def _bootstrap_data_if_empty() -> None:
    """On a brand-new deployment (no DB file yet), create tables and seed
    master data + mock data automatically so the app is usable without SSH
    access. No-op if the DB already exists (e.g. a redeploy)."""
    db_path = DATA_DIR / "sre_dashboard.db"
    if db_path.exists():
        return

    from scripts.generate_mock_data import generate

    generate()


@asynccontextmanager
async def lifespan(_: FastAPI):
    _bootstrap_data_if_empty()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(teams.router)
app.include_router(applications.router)
app.include_router(templates.router)
app.include_router(uploads.router)
app.include_router(health.router)
app.include_router(analytics.router)


@app.get("/api/health-check")
def health_check() -> dict:
    return {"status": "ok"}


# Serve the built React app (frontend/dist, copied here at build time as
# app/static — see the GitHub Actions workflow) for everything that isn't
# an /api/* route, with an SPA fallback so client-side routes work on
# direct load/refresh. Only mounted if the static build is actually present,
# so local dev (where main.py is run without a frontend build) is unaffected.
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str) -> FileResponse:
        candidate = STATIC_DIR / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(STATIC_DIR / "index.html")
