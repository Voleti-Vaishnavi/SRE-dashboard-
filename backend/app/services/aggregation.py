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


def group_counts_and_entities_by_bucket(
    rows: list[tuple[date, str, str]], granularity: str
) -> dict[str, dict]:
    """rows: list of (date, status_value, entity_name) — entity_name is whatever
    contributed to that count (an application name, "App: Job Name", etc).
    Returns {bucket: {"counts": {status: count}, "entities": {status: [names]}}}
    sorted by bucket, with entity names de-duplicated and sorted per status."""
    counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    entities: dict[str, dict[str, set]] = defaultdict(lambda: defaultdict(set))
    for d, status, entity_name in rows:
        key = bucket_key(d, granularity)
        counts[key][status] += 1
        entities[key][status].add(entity_name)

    return {
        k: {
            "counts": dict(counts[k]),
            "entities": {status: sorted(names) for status, names in entities[k].items()},
        }
        for k in sorted(counts.keys())
    }


def entity_lists_by_status(rows: list[tuple[str, str]]) -> dict[str, list[str]]:
    """rows: list of (status_value, entity_name). Returns {status: [unique sorted names]},
    for non-bucketed (single-snapshot) breakdowns like health-summary/change-summary."""
    grouped: dict[str, set] = defaultdict(set)
    for status, entity_name in rows:
        grouped[status].add(entity_name)
    return {status: sorted(names) for status, names in grouped.items()}
