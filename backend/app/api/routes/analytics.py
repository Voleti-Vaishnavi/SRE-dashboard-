from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import (
    Application,
    ApplicationHealth,
    ChangeDeployment,
    CriticalFileMonitoring,
    InterfaceMonitoring,
    JobMonitoring,
    UrlAvailability,
)
from app.services.aggregation import (
    bucket_key,
    default_date_range,
    group_counts_by_bucket,
    previous_period,
)
from app.utils.enums import ChangeStatus, FourEyeStatus, HealthStatus

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

MONITORING_MODELS = {
    "url": UrlAvailability,
    "job": JobMonitoring,
    "interface": InterfaceMonitoring,
    "critical_file": CriticalFileMonitoring,
}


def _validate_granularity(granularity: str) -> None:
    if granularity not in ("daily", "weekly", "monthly", "yearly"):
        raise HTTPException(status_code=400, detail=f"Invalid granularity '{granularity}'")


def _resolve_range(
    db: Session, model, date_col, start_date: date | None, end_date: date | None
) -> tuple[date, date]:
    if start_date and end_date:
        return start_date, end_date
    default_start, default_end = default_date_range(db, model, date_col)
    return start_date or default_start, end_date or default_end


def _app_ids_for_team(db: Session, team_id: int | None) -> list[int] | None:
    if team_id is None:
        return None
    return [a for (a,) in db.query(Application.id).filter_by(team_id=team_id).all()]


@router.get("/kpis")
def kpis(
    start_date: date | None = None,
    end_date: date | None = None,
    team_id: int | None = None,
    application_id: int | None = None,
    db: Session = Depends(get_db),
) -> dict:
    start_date, end_date = _resolve_range(db, ApplicationHealth, ApplicationHealth.date, start_date, end_date)
    prev_start, prev_end = previous_period(start_date, end_date)

    app_query = db.query(Application)
    if team_id is not None:
        app_query = app_query.filter(Application.team_id == team_id)
    if application_id is not None:
        app_query = app_query.filter(Application.id == application_id)
    total_apps = app_query.count()

    def health_query(s: date, e: date):
        q = db.query(ApplicationHealth).filter(
            ApplicationHealth.date >= s, ApplicationHealth.date <= e
        )
        if team_id is not None:
            q = q.join(Application, ApplicationHealth.application_id == Application.id).filter(
                Application.team_id == team_id
            )
        if application_id is not None:
            q = q.filter(ApplicationHealth.application_id == application_id)
        return q

    latest_date_row = health_query(start_date, end_date).order_by(
        ApplicationHealth.date.desc()
    ).first()
    latest_date = latest_date_row.date if latest_date_row else end_date
    latest_rows = health_query(latest_date, latest_date).all()
    pct_green = (
        100.0 * sum(1 for r in latest_rows if r.health_status == HealthStatus.GREEN.value) / len(latest_rows)
        if latest_rows
        else 0.0
    )

    def change_query(s: date, e: date):
        q = db.query(ChangeDeployment).filter(
            ChangeDeployment.date >= s, ChangeDeployment.date <= e
        )
        if team_id is not None:
            q = q.join(Application, ChangeDeployment.application_id == Application.id).filter(
                Application.team_id == team_id
            )
        if application_id is not None:
            q = q.filter(ChangeDeployment.application_id == application_id)
        return q

    def rates(s: date, e: date) -> tuple[float, float]:
        rows = change_query(s, e).all()
        total = len(rows)
        success = sum(1 for r in rows if r.change_status == ChangeStatus.SUCCESS.value)
        completed = sum(1 for r in rows if r.four_eye_status == FourEyeStatus.COMPLETED.value)
        success_rate = 100.0 * success / total if total else 0.0
        completion_rate = 100.0 * completed / total if total else 0.0
        return success_rate, completion_rate

    success_rate, completion_rate = rates(start_date, end_date)
    prev_success_rate, prev_completion_rate = rates(prev_start, prev_end)

    return {
        "period": {"start_date": start_date, "end_date": end_date},
        "total_applications": total_apps,
        "pct_green_latest": round(pct_green, 1),
        "latest_health_date": latest_date,
        "change_success_rate": round(success_rate, 1),
        "change_success_rate_delta": round(success_rate - prev_success_rate, 1),
        "four_eye_completion_rate": round(completion_rate, 1),
        "four_eye_completion_rate_delta": round(completion_rate - prev_completion_rate, 1),
    }


@router.get("/health-summary")
def health_summary(
    start_date: date | None = None,
    end_date: date | None = None,
    team_id: int | None = None,
    application_id: int | None = None,
    db: Session = Depends(get_db),
) -> dict:
    start_date, end_date = _resolve_range(db, ApplicationHealth, ApplicationHealth.date, start_date, end_date)

    query = (
        db.query(ApplicationHealth, Application.team_id, Application.name)
        .join(Application, ApplicationHealth.application_id == Application.id)
        .filter(ApplicationHealth.date >= start_date, ApplicationHealth.date <= end_date)
    )
    if team_id is not None:
        query = query.filter(Application.team_id == team_id)
    if application_id is not None:
        query = query.filter(ApplicationHealth.application_id == application_id)

    rows = query.all()
    latest_by_app: dict[int, tuple] = {}
    for health, t_id, app_name in rows:
        current = latest_by_app.get(health.application_id)
        if current is None or health.date > current[0].date:
            latest_by_app[health.application_id] = (health, t_id, app_name)

    overall = {s.value: 0 for s in HealthStatus}
    per_team: dict[int, dict[str, int]] = {}
    for health, t_id, _ in latest_by_app.values():
        overall[health.health_status] += 1
        per_team.setdefault(t_id, {s.value: 0 for s in HealthStatus})
        per_team[t_id][health.health_status] += 1

    return {
        "period": {"start_date": start_date, "end_date": end_date},
        "overall": overall,
        "per_team": per_team,
    }


@router.get("/health-trend")
def health_trend(
    granularity: str = "daily",
    start_date: date | None = None,
    end_date: date | None = None,
    team_id: int | None = None,
    application_id: int | None = None,
    db: Session = Depends(get_db),
) -> dict:
    _validate_granularity(granularity)
    start_date, end_date = _resolve_range(db, ApplicationHealth, ApplicationHealth.date, start_date, end_date)

    query = db.query(ApplicationHealth.date, ApplicationHealth.health_status).filter(
        ApplicationHealth.date >= start_date, ApplicationHealth.date <= end_date
    )
    if team_id is not None:
        query = query.join(Application, ApplicationHealth.application_id == Application.id).filter(
            Application.team_id == team_id
        )
    if application_id is not None:
        query = query.filter(ApplicationHealth.application_id == application_id)

    buckets = group_counts_by_bucket(query.all(), granularity)
    return {
        "granularity": granularity,
        "period": {"start_date": start_date, "end_date": end_date},
        "buckets": [{"bucket": b, "counts": counts} for b, counts in buckets.items()],
    }


@router.get("/change-summary")
def change_summary(
    start_date: date | None = None,
    end_date: date | None = None,
    team_id: int | None = None,
    application_id: int | None = None,
    db: Session = Depends(get_db),
) -> dict:
    start_date, end_date = _resolve_range(db, ChangeDeployment, ChangeDeployment.date, start_date, end_date)

    query = db.query(ChangeDeployment).filter(
        ChangeDeployment.date >= start_date, ChangeDeployment.date <= end_date
    )
    if team_id is not None:
        query = query.join(Application, ChangeDeployment.application_id == Application.id).filter(
            Application.team_id == team_id
        )
    if application_id is not None:
        query = query.filter(ChangeDeployment.application_id == application_id)

    rows = query.all()
    change_status_counts = {s.value: 0 for s in ChangeStatus}
    four_eye_counts = {s.value: 0 for s in FourEyeStatus}
    for r in rows:
        change_status_counts[r.change_status] += 1
        four_eye_counts[r.four_eye_status] += 1

    return {
        "period": {"start_date": start_date, "end_date": end_date},
        "total_changes": len(rows),
        "change_status": change_status_counts,
        "four_eye_status": four_eye_counts,
    }


@router.get("/change-trend")
def change_trend(
    granularity: str = "daily",
    start_date: date | None = None,
    end_date: date | None = None,
    team_id: int | None = None,
    application_id: int | None = None,
    db: Session = Depends(get_db),
) -> dict:
    _validate_granularity(granularity)
    start_date, end_date = _resolve_range(db, ChangeDeployment, ChangeDeployment.date, start_date, end_date)

    query = db.query(ChangeDeployment.date, ChangeDeployment.change_status).filter(
        ChangeDeployment.date >= start_date, ChangeDeployment.date <= end_date
    )
    if team_id is not None:
        query = query.join(Application, ChangeDeployment.application_id == Application.id).filter(
            Application.team_id == team_id
        )
    if application_id is not None:
        query = query.filter(ChangeDeployment.application_id == application_id)

    buckets = group_counts_by_bucket(query.all(), granularity)
    return {
        "granularity": granularity,
        "period": {"start_date": start_date, "end_date": end_date},
        "buckets": [{"bucket": b, "counts": counts} for b, counts in buckets.items()],
    }


@router.get("/changes")
def changes(
    start_date: date | None = None,
    end_date: date | None = None,
    team_id: int | None = None,
    application_id: int | None = None,
    change_status: str | None = None,
    four_eye_status: str | None = None,
    page: int = 1,
    page_size: int = 25,
    sort: str = "-date",
    db: Session = Depends(get_db),
) -> dict:
    query = db.query(ChangeDeployment, Application.name).join(
        Application, ChangeDeployment.application_id == Application.id
    )
    if start_date:
        query = query.filter(ChangeDeployment.date >= start_date)
    if end_date:
        query = query.filter(ChangeDeployment.date <= end_date)
    if team_id is not None:
        query = query.filter(Application.team_id == team_id)
    if application_id is not None:
        query = query.filter(ChangeDeployment.application_id == application_id)
    if change_status:
        query = query.filter(ChangeDeployment.change_status == change_status)
    if four_eye_status:
        query = query.filter(ChangeDeployment.four_eye_status == four_eye_status)

    total = query.count()

    sort_field = sort.lstrip("-")
    sort_desc = sort.startswith("-")
    sortable = {
        "date": ChangeDeployment.date,
        "cr_number": ChangeDeployment.cr_number,
        "change_status": ChangeDeployment.change_status,
        "four_eye_status": ChangeDeployment.four_eye_status,
    }
    order_col = sortable.get(sort_field, ChangeDeployment.date)
    query = query.order_by(order_col.desc() if sort_desc else order_col.asc())

    rows = query.offset((page - 1) * page_size).limit(page_size).all()
    items = [
        {
            "id": cd.id,
            "cr_number": cd.cr_number,
            "application_id": cd.application_id,
            "application_name": app_name,
            "tower_name": cd.tower_name,
            "assignment_group": cd.assignment_group,
            "description": cd.description,
            "assigned_to": cd.assigned_to,
            "change_status": cd.change_status,
            "four_eye_status": cd.four_eye_status,
            "date": cd.date,
        }
        for cd, app_name in rows
    ]

    return {"total": total, "page": page, "page_size": page_size, "items": items}


@router.get("/monitoring-summary")
def monitoring_summary(
    category: str,
    granularity: str = "daily",
    start_date: date | None = None,
    end_date: date | None = None,
    team_id: int | None = None,
    application_id: int | None = None,
    db: Session = Depends(get_db),
) -> dict:
    _validate_granularity(granularity)
    model = MONITORING_MODELS.get(category)
    if model is None:
        raise HTTPException(status_code=400, detail=f"Unknown monitoring category '{category}'")

    start_date, end_date = _resolve_range(db, model, model.date, start_date, end_date)

    query = db.query(model.date, model.status).filter(
        model.date >= start_date, model.date <= end_date
    )
    if team_id is not None:
        query = query.join(Application, model.application_id == Application.id).filter(
            Application.team_id == team_id
        )
    if application_id is not None:
        query = query.filter(model.application_id == application_id)

    buckets = group_counts_by_bucket(query.all(), granularity)
    return {
        "category": category,
        "granularity": granularity,
        "period": {"start_date": start_date, "end_date": end_date},
        "buckets": [{"bucket": b, "counts": counts} for b, counts in buckets.items()],
    }


ITEM_NAME_FIELDS = {
    "job": "job_name",
    "interface": "interface_name",
    "critical_file": "file_name",
}


@router.get("/monitoring-items")
def monitoring_items(
    category: str,
    application_id: int,
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
) -> list[dict]:
    model = MONITORING_MODELS.get(category)
    item_field = ITEM_NAME_FIELDS.get(category)
    if model is None or item_field is None:
        raise HTTPException(status_code=400, detail=f"Unknown monitoring item category '{category}'")

    item_col = getattr(model, item_field)
    query = db.query(item_col, model.date, model.status).filter(model.application_id == application_id)
    if start_date:
        query = query.filter(model.date >= start_date)
    if end_date:
        query = query.filter(model.date <= end_date)

    rows = query.order_by(item_col.asc(), model.date.desc()).all()
    return [{"item_name": item_name, "date": d, "status": status} for item_name, d, status in rows]


@router.get("/application/{application_id}/health-calendar")
def health_calendar(application_id: int, year: int, db: Session = Depends(get_db)) -> list[dict]:
    rows = (
        db.query(ApplicationHealth)
        .filter(
            ApplicationHealth.application_id == application_id,
            ApplicationHealth.date >= date(year, 1, 1),
            ApplicationHealth.date <= date(year, 12, 31),
        )
        .order_by(ApplicationHealth.date)
        .all()
    )
    return [{"date": r.date, "health_status": r.health_status} for r in rows]
