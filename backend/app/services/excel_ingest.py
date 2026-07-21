import io
import json
from dataclasses import dataclass, field
from datetime import date, datetime

import pandas as pd
from sqlalchemy.orm import Session

from app.models import (
    Application,
    ChangeDeployment,
    CriticalFileMonitoring,
    InterfaceMonitoring,
    JobMonitoring,
    UploadAudit,
    UrlAvailability,
)
from app.services.upsert import upsert_record
from app.utils.enums import ChangeStatus, FourEyeStatus, RunStatus, UrlStatus

HEADER_ROWS = 2  # header row + example row, so first data row is row 3 in the sheet


@dataclass
class RowError:
    row: int
    message: str


@dataclass
class IngestResult:
    rows_read: int = 0
    inserted: int = 0
    updated: int = 0
    skipped: int = 0
    errors: list[RowError] = field(default_factory=list)
    affected_app_dates: set[tuple[int, date]] = field(default_factory=set)


def _read_dataframe(file_bytes: bytes) -> pd.DataFrame:
    xls = pd.ExcelFile(io.BytesIO(file_bytes))
    sheet_name = "Data" if "Data" in xls.sheet_names else xls.sheet_names[0]
    df = xls.parse(sheet_name)
    return df.dropna(how="all")


def _parse_date(value) -> date | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    try:
        parsed = pd.to_datetime(value)
        return None if pd.isna(parsed) else parsed.date()
    except (ValueError, TypeError):
        return None


def _clean_optional(value) -> str | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    text = str(value).strip()
    return text or None


def _require(row: pd.Series, col: str, row_num: int, errors: list[RowError]) -> str | None:
    value = _clean_optional(row.get(col))
    if value is None:
        errors.append(RowError(row_num, f"Missing required value for '{col}'"))
    return value


def _app_lookup(db: Session) -> dict[str, int]:
    return {name: id_ for id_, name in db.query(Application.id, Application.name).all()}


def ingest_change_deployments(db: Session, file_bytes: bytes) -> IngestResult:
    df = _read_dataframe(file_bytes)
    result = IngestResult(rows_read=len(df))
    app_ids = _app_lookup(db)
    valid_change_status = {s.value for s in ChangeStatus}
    valid_four_eye = {s.value for s in FourEyeStatus}

    for idx, row in df.iterrows():
        row_num = idx + HEADER_ROWS + 1
        errors_before = len(result.errors)

        app_name = _require(row, "Application Name", row_num, result.errors)
        tower_name = _require(row, "Tower Name", row_num, result.errors)
        cr_number = _require(row, "CR Number", row_num, result.errors)
        change_status = _require(row, "Change Status", row_num, result.errors)
        four_eye_status = _require(row, "4-Eye Review Status", row_num, result.errors)
        row_date = _parse_date(row.get("Date"))
        if row_date is None:
            result.errors.append(RowError(row_num, "Missing or invalid 'Date'"))

        if app_name and app_name not in app_ids:
            result.errors.append(RowError(row_num, f"Unknown Application Name '{app_name}'"))
        if change_status and change_status not in valid_change_status:
            result.errors.append(RowError(row_num, f"Invalid Change Status '{change_status}'"))
        if four_eye_status and four_eye_status not in valid_four_eye:
            result.errors.append(
                RowError(row_num, f"Invalid 4-Eye Review Status '{four_eye_status}'")
            )

        if len(result.errors) > errors_before:
            result.skipped += 1
            continue

        application_id = app_ids[app_name]
        values = {
            "cr_number": cr_number,
            "application_id": application_id,
            "tower_name": tower_name,
            "assignment_group": _clean_optional(row.get("Assignment Group")),
            "description": _clean_optional(row.get("Description")),
            "assigned_to": _clean_optional(row.get("Assigned To")),
            "change_status": change_status,
            "four_eye_status": four_eye_status,
            "date": row_date,
        }
        inserted = upsert_record(db, ChangeDeployment, {"cr_number": cr_number}, values)
        result.inserted += int(inserted)
        result.updated += int(not inserted)
        result.affected_app_dates.add((application_id, row_date))

    db.commit()
    return result


def ingest_url_availability(db: Session, file_bytes: bytes) -> IngestResult:
    df = _read_dataframe(file_bytes)
    result = IngestResult(rows_read=len(df))
    app_ids = _app_lookup(db)
    valid_status = {s.value for s in UrlStatus}

    for idx, row in df.iterrows():
        row_num = idx + HEADER_ROWS + 1
        errors_before = len(result.errors)

        app_name = _require(row, "Application Name", row_num, result.errors)
        status = _require(row, "Status", row_num, result.errors)
        row_date = _parse_date(row.get("Date"))
        if row_date is None:
            result.errors.append(RowError(row_num, "Missing or invalid 'Date'"))
        if app_name and app_name not in app_ids:
            result.errors.append(RowError(row_num, f"Unknown Application Name '{app_name}'"))
        if status and status not in valid_status:
            result.errors.append(RowError(row_num, f"Invalid Status '{status}'"))

        if len(result.errors) > errors_before:
            result.skipped += 1
            continue

        application_id = app_ids[app_name]
        key = {"application_id": application_id, "date": row_date}
        inserted = upsert_record(db, UrlAvailability, key, {**key, "status": status})
        result.inserted += int(inserted)
        result.updated += int(not inserted)
        result.affected_app_dates.add((application_id, row_date))

    db.commit()
    return result


def _ingest_named_item(
    db: Session,
    file_bytes: bytes,
    model,
    item_column: str,
    item_field: str,
) -> IngestResult:
    df = _read_dataframe(file_bytes)
    result = IngestResult(rows_read=len(df))
    app_ids = _app_lookup(db)
    valid_status = {s.value for s in RunStatus}

    for idx, row in df.iterrows():
        row_num = idx + HEADER_ROWS + 1
        errors_before = len(result.errors)

        app_name = _require(row, "Application Name", row_num, result.errors)
        item_name = _require(row, item_column, row_num, result.errors)
        status = _require(row, "Status", row_num, result.errors)
        row_date = _parse_date(row.get("Date"))
        if row_date is None:
            result.errors.append(RowError(row_num, "Missing or invalid 'Date'"))
        if app_name and app_name not in app_ids:
            result.errors.append(RowError(row_num, f"Unknown Application Name '{app_name}'"))
        if status and status not in valid_status:
            result.errors.append(RowError(row_num, f"Invalid Status '{status}'"))

        if len(result.errors) > errors_before:
            result.skipped += 1
            continue

        application_id = app_ids[app_name]
        key = {"application_id": application_id, item_field: item_name, "date": row_date}
        inserted = upsert_record(db, model, key, {**key, "status": status})
        result.inserted += int(inserted)
        result.updated += int(not inserted)
        result.affected_app_dates.add((application_id, row_date))

    db.commit()
    return result


def ingest_job_monitoring(db: Session, file_bytes: bytes) -> IngestResult:
    return _ingest_named_item(db, file_bytes, JobMonitoring, "Job Name", "job_name")


def ingest_interface_monitoring(db: Session, file_bytes: bytes) -> IngestResult:
    return _ingest_named_item(
        db, file_bytes, InterfaceMonitoring, "Interface Name", "interface_name"
    )


def ingest_critical_file_monitoring(db: Session, file_bytes: bytes) -> IngestResult:
    return _ingest_named_item(db, file_bytes, CriticalFileMonitoring, "File Name", "file_name")


INGEST_FUNCTIONS = {
    "change-deployments": ingest_change_deployments,
    "url-availability": ingest_url_availability,
    "job-monitoring": ingest_job_monitoring,
    "interface-monitoring": ingest_interface_monitoring,
    "critical-file-monitoring": ingest_critical_file_monitoring,
}


def record_upload_audit(db: Session, category: str, filename: str, result: IngestResult) -> None:
    errors_json = json.dumps([{"row": e.row, "message": e.message} for e in result.errors])
    db.add(
        UploadAudit(
            category=category,
            filename=filename,
            rows_read=result.rows_read,
            rows_inserted=result.inserted,
            rows_updated=result.updated,
            rows_skipped=result.skipped,
            errors_json=errors_json,
        )
    )
    db.commit()
