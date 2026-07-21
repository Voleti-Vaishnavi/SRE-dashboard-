from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Application, ApplicationHealth
from app.services.health_calculator import recompute_health_for_app_dates

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("/daily")
def daily_health(
    start_date: date | None = None,
    end_date: date | None = None,
    team_id: int | None = None,
    application_id: int | None = None,
    db: Session = Depends(get_db),
) -> list[dict]:
    end_date = end_date or date.today()
    start_date = start_date or end_date - timedelta(days=29)

    query = (
        db.query(ApplicationHealth, Application.name, Application.team_id)
        .join(Application, ApplicationHealth.application_id == Application.id)
        .filter(ApplicationHealth.date >= start_date, ApplicationHealth.date <= end_date)
    )
    if team_id is not None:
        query = query.filter(Application.team_id == team_id)
    if application_id is not None:
        query = query.filter(ApplicationHealth.application_id == application_id)

    results = []
    for health, app_name, app_team_id in query.order_by(ApplicationHealth.date).all():
        results.append(
            {
                "application_id": health.application_id,
                "application_name": app_name,
                "team_id": app_team_id,
                "date": health.date,
                "health_status": health.health_status,
                "categories_evaluated": health.categories_evaluated,
                "categories_failing": health.categories_failing,
                "url_failing": health.url_failing,
                "job_failing": health.job_failing,
                "interface_failing": health.interface_failing,
                "critical_file_failing": health.critical_file_failing,
            }
        )
    return results


@router.post("/recompute")
def recompute(
    start_date: date,
    end_date: date,
    application_id: int | None = None,
    db: Session = Depends(get_db),
) -> dict:
    apps = [application_id] if application_id else [a for (a,) in db.query(Application.id).all()]
    app_dates = set()
    current = start_date
    while current <= end_date:
        for app_id in apps:
            app_dates.add((app_id, current))
        current += timedelta(days=1)

    recomputed = recompute_health_for_app_dates(db, app_dates)
    return {"recomputed": len(recomputed)}
