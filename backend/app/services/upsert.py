from sqlalchemy.orm import Session


def upsert_record(
    db: Session,
    model,
    key_values: dict,
    all_values: dict,
) -> bool:
    """Insert or update a row keyed by `key_values`. Returns True if a new row
    was inserted, False if an existing row was updated."""
    existing = db.query(model).filter_by(**key_values).one_or_none()
    if existing is None:
        db.add(model(**all_values))
        return True

    for field, value in all_values.items():
        setattr(existing, field, value)
    return False
