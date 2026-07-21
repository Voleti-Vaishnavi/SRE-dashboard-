from collections import defaultdict
from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

GRANULARITIES = ("daily", "weekly", "monthly", "yearly")


def bucket_key(d: date, granularity: str) -> str:
    if granularity == "daily":
        return d.isoformat()
    if granularity == "weekly":
        monday = d - timedelta(days=d.weekday())
        return monday.isoformat()
    if granularity == "monthly":
        return d.replace(day=1).isoformat()[:7]
    if granularity == "yearly":
        return str(d.year)
    raise ValueError(f"Unknown granularity '{granularity}'")


def default_date_range(db: Session, model, date_col) -> tuple[date, date]:
    min_max = db.query(func.min(date_col), func.max(date_col)).select_from(model).one()
    min_date, max_date = min_max
    today = date.today()
    if min_date is None or max_date is None:
        return today - timedelta(days=29), today
    return min_date, max_date


def previous_period(start_date: date, end_date: date) -> tuple[date, date]:
    span = (end_date - start_date).days + 1
    prev_end = start_date - timedelta(days=1)
    prev_start = prev_end - timedelta(days=span - 1)
    return prev_start, prev_end


def group_counts_by_bucket(
    rows: list[tuple[date, str]], granularity: str
) -> dict[str, dict[str, int]]:
    """rows: list of (date, status_value). Returns {bucket: {status: count}} sorted by bucket."""
    buckets: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for d, status in rows:
        buckets[bucket_key(d, granularity)][status] += 1
    return {k: dict(v) for k, v in sorted(buckets.items())}
