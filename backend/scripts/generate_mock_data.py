"""Generate ~30 days of mock Excel data for all 5 upload categories plus a
master-data reference workbook, then ingest everything through the real
ingestion + health-calculation pipeline so the demo dashboard reflects
actual application behavior rather than hardcoded numbers.

Reproducible: uses a fixed random seed. Re-running regenerates the same data
(and re-uploading is idempotent thanks to upsert-by-key ingestion).
"""

import io
import random
from datetime import date, timedelta

from openpyxl import Workbook
from openpyxl.utils import get_column_letter

from app.core.config import MOCK_EXCEL_DIR
from app.core.database import Base, SessionLocal, engine
from app.models import Application
from app.services.excel_ingest import (
    ingest_change_deployments,
    ingest_critical_file_monitoring,
    ingest_interface_monitoring,
    ingest_job_monitoring,
    ingest_url_availability,
)
from app.services.health_calculator import recompute_health_for_app_dates
from app.utils.excel_utils import autosize_columns, style_header_row
from scripts.seed_master_data import seed_master_data

RANDOM_SEED = 42
DAYS_OF_HISTORY = 30

# Failure/pending probabilities per Medal Category, used to make Red/Amber
# days cluster plausibly rather than being pure noise. Demo convenience only.
RELIABILITY_PROFILE = {
    "Gold": {"fail": 0.03, "pending": 0.02},
    "Silver": {"fail": 0.06, "pending": 0.04},
    "Bronze": {"fail": 0.10, "pending": 0.06},
    "Tin": {"fail": 0.18, "pending": 0.08},
}

JOB_NAME_POOL = ["Nightly Batch Job", "Data Sync Job", "Report Generation Job", "Cleanup Job"]
INTERFACE_NAME_POOL = ["Payment Gateway Interface", "Auth Service Interface", "Reporting Interface"]
FILE_NAME_POOL = ["EOD_Reconciliation.csv", "Daily_Extract.csv"]

ASSIGNMENT_GROUPS = [
    "RCIS Deployment Team",
    "NON RCIS Support",
    "Shared Services Ops",
    "WAM ITOT Engineering",
    "Platform Reliability Team",
]
ASSIGNEES = ["Jane Doe", "John Smith", "Amit Kumar", "Maria Garcia", "Li Wei", "Sara Ahmed", "Tom Becker"]
DESCRIPTIONS = [
    "Deploy latest release to production",
    "Apply security patch",
    "Configuration update",
    "Hotfix for reported defect",
    "Scheduled maintenance release",
    "Database schema migration",
]


def _date_range() -> list[date]:
    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=DAYS_OF_HISTORY - 1)
    return [start + timedelta(days=i) for i in range(DAYS_OF_HISTORY)]


def _write_workbook(path, headers: list[str], rows: list[list]) -> None:
    wb = Workbook()
    ws = wb.active
    ws.title = "Data"
    ws.append(headers)
    for row in rows:
        ws.append(row)
    style_header_row(ws, len(headers))
    autosize_columns(ws, headers)
    ws.freeze_panes = "A2"
    wb.save(path)


def _weighted_status(profile: dict, success: str, failure: str, pending: str | None = None) -> str:
    r = random.random()
    if r < profile["fail"]:
        return failure
    if pending is not None and r < profile["fail"] + profile["pending"]:
        return pending
    return success


def generate() -> None:
    random.seed(RANDOM_SEED)

    seed_master_data()
    db = SessionLocal()
    apps = db.query(Application).order_by(Application.id).all()
    app_info = [(a.id, a.name, a.team.name, a.medal_category) for a in apps]
    db.close()

    dates = _date_range()

    # Fixed named items per app (deterministic given seeded RNG + iteration order).
    app_jobs = {name: JOB_NAME_POOL[: random.randint(1, len(JOB_NAME_POOL))] for _, name, _, _ in app_info}
    app_interfaces = {
        name: INTERFACE_NAME_POOL[: random.randint(0, len(INTERFACE_NAME_POOL))]
        for _, name, _, _ in app_info
    }
    app_files = {name: FILE_NAME_POOL[: random.randint(0, len(FILE_NAME_POOL))] for _, name, _, _ in app_info}

    url_rows, job_rows, interface_rows, file_rows, change_rows = [], [], [], [], []
    cr_counter = 1000001

    for app_id, name, team_name, medal in app_info:
        profile = RELIABILITY_PROFILE[medal]

        for d in dates:
            url_rows.append([name, d, _weighted_status(profile, "Operational", "Non Operational")])

            for job in app_jobs[name]:
                job_rows.append(
                    [name, job, d, _weighted_status(profile, "Success", "Failure", "Yet to Run")]
                )
            for iface in app_interfaces[name]:
                interface_rows.append(
                    [name, iface, d, _weighted_status(profile, "Success", "Failure", "Yet to Run")]
                )
            for fname in app_files[name]:
                file_rows.append(
                    [name, fname, d, _weighted_status(profile, "Success", "Failure", "Yet to Run")]
                )

            num_crs = random.choices([0, 1, 2], weights=[0.85, 0.13, 0.02])[0]
            for _ in range(num_crs):
                change_status = random.choices(
                    ["Success", "Failure", "WIP"], weights=[0.75, 0.15, 0.10]
                )[0]
                four_eye_status = random.choices(
                    ["Completed", "Not Completed", "WIP"], weights=[0.80, 0.10, 0.10]
                )[0]
                change_rows.append(
                    [
                        name,
                        team_name,
                        f"CHG{cr_counter:07d}",
                        random.choice(ASSIGNMENT_GROUPS),
                        random.choice(DESCRIPTIONS),
                        random.choice(ASSIGNEES),
                        change_status,
                        four_eye_status,
                        d,
                    ]
                )
                cr_counter += 1

    _write_workbook(
        MOCK_EXCEL_DIR / "url_availability_mock.xlsx",
        ["Application Name", "Date", "Status"],
        url_rows,
    )
    _write_workbook(
        MOCK_EXCEL_DIR / "job_monitoring_mock.xlsx",
        ["Application Name", "Job Name", "Date", "Status"],
        job_rows,
    )
    _write_workbook(
        MOCK_EXCEL_DIR / "interface_monitoring_mock.xlsx",
        ["Application Name", "Interface Name", "Date", "Status"],
        interface_rows,
    )
    _write_workbook(
        MOCK_EXCEL_DIR / "critical_file_monitoring_mock.xlsx",
        ["Application Name", "File Name", "Date", "Status"],
        file_rows,
    )
    _write_workbook(
        MOCK_EXCEL_DIR / "change_deployments_mock.xlsx",
        [
            "Application Name",
            "Tower Name",
            "CR Number",
            "Assignment Group",
            "Description",
            "Assigned To",
            "Change Status",
            "4-Eye Review Status",
            "Date",
        ],
        change_rows,
    )
    _write_workbook(
        MOCK_EXCEL_DIR / "application_information_master.xlsx",
        ["Application Name", "Team Name", "Medal Category"],
        [[name, team_name, medal] for _, name, team_name, medal in app_info],
    )

    print(f"Generated mock workbooks in {MOCK_EXCEL_DIR}")
    print(
        f"  url_availability: {len(url_rows)} rows, job_monitoring: {len(job_rows)} rows, "
        f"interface_monitoring: {len(interface_rows)} rows, critical_file_monitoring: {len(file_rows)} rows, "
        f"change_deployments: {len(change_rows)} rows"
    )

    _ingest_all()


def _ingest_all() -> None:
    db = SessionLocal()
    affected: set[tuple[int, date]] = set()

    def _run(fn, filename: str):
        with open(MOCK_EXCEL_DIR / filename, "rb") as f:
            content = f.read()
        result = fn(db, content)
        affected.update(result.affected_app_dates)
        print(f"  ingested {filename}: {result.inserted} inserted, {result.updated} updated, {result.skipped} skipped, {len(result.errors)} errors")
        if result.errors[:5]:
            for e in result.errors[:5]:
                print(f"    row {e.row}: {e.message}")

    _run(ingest_url_availability, "url_availability_mock.xlsx")
    _run(ingest_job_monitoring, "job_monitoring_mock.xlsx")
    _run(ingest_interface_monitoring, "interface_monitoring_mock.xlsx")
    _run(ingest_critical_file_monitoring, "critical_file_monitoring_mock.xlsx")
    _run(ingest_change_deployments, "change_deployments_mock.xlsx")

    recomputed = recompute_health_for_app_dates(db, affected)
    print(f"Recomputed health for {len(recomputed)} application+date combinations.")

    from collections import Counter

    status_counts = Counter(h.health_status for h in recomputed)
    print(f"Health distribution: {dict(status_counts)}")

    db.close()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    generate()
