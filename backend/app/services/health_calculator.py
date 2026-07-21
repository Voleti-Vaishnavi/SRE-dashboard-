from datetime import date

from sqlalchemy.orm import Session

from app.models import (
    ApplicationHealth,
    CriticalFileMonitoring,
    InterfaceMonitoring,
    JobMonitoring,
    UrlAvailability,
)
from app.services.upsert import upsert_record
from app.utils.enums import HealthStatus, RunStatus, UrlStatus


def _category_failing(rows: list[str]) -> bool | None:
    """Given the list of status values for a category on one app+day, return
    True if it should count as failing, False if healthy, None if no data at all."""
    if not rows:
        return None
    return any(status in (RunStatus.FAILURE.value, UrlStatus.NON_OPERATIONAL.value) for status in rows)


def compute_health(db: Session, application_id: int, on_date: date) -> ApplicationHealth:
    url_rows = [
        s
        for (s,) in db.query(UrlAvailability.status)
        .filter_by(application_id=application_id, date=on_date)
        .all()
    ]
    job_rows = [
        s
        for (s,) in db.query(JobMonitoring.status)
        .filter_by(application_id=application_id, date=on_date)
        .all()
    ]
    interface_rows = [
        s
        for (s,) in db.query(InterfaceMonitoring.status)
        .filter_by(application_id=application_id, date=on_date)
        .all()
    ]
    critical_file_rows = [
        s
        for (s,) in db.query(CriticalFileMonitoring.status)
        .filter_by(application_id=application_id, date=on_date)
        .all()
    ]

    url_failing = _category_failing(url_rows)
    job_failing = _category_failing(job_rows)
    interface_failing = _category_failing(interface_rows)
    critical_file_failing = _category_failing(critical_file_rows)

    failings = [url_failing, job_failing, interface_failing, critical_file_failing]
    evaluated = [f for f in failings if f is not None]
    categories_evaluated = len(evaluated)
    categories_failing = sum(1 for f in evaluated if f)

    if categories_evaluated == 0:
        health_status = HealthStatus.NO_DATA.value
    elif categories_failing == 0:
        health_status = HealthStatus.GREEN.value
    elif categories_failing == 1:
        health_status = HealthStatus.AMBER.value
    else:
        health_status = HealthStatus.RED.value

    key = {"application_id": application_id, "date": on_date}
    values = {
        **key,
        "url_failing": url_failing,
        "job_failing": job_failing,
        "interface_failing": interface_failing,
        "critical_file_failing": critical_file_failing,
        "categories_evaluated": categories_evaluated,
        "categories_failing": categories_failing,
        "health_status": health_status,
    }
    upsert_record(db, ApplicationHealth, key, values)
    db.commit()
    return db.query(ApplicationHealth).filter_by(**key).one()


def recompute_health_for_app_dates(
    db: Session, app_dates: set[tuple[int, date]]
) -> list[ApplicationHealth]:
    return [compute_health(db, application_id, on_date) for application_id, on_date in app_dates]
