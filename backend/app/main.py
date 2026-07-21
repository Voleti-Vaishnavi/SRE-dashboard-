from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import analytics, applications, health, teams, templates, uploads
from app.core.config import settings

app = FastAPI(title=settings.app_name)

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
