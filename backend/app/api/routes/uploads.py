from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.excel_ingest import INGEST_FUNCTIONS, record_upload_audit
from app.services.health_calculator import recompute_health_for_app_dates
from app.models import UploadAudit

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


@router.post("/{category}")
async def upload_category(
    category: str, file: UploadFile = File(...), db: Session = Depends(get_db)
) -> dict:
    ingest_fn = INGEST_FUNCTIONS.get(category)
    if ingest_fn is None:
        raise HTTPException(status_code=404, detail=f"Unknown upload category '{category}'")

    if not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported")

    file_bytes = await file.read()
    try:
        result = ingest_fn(db, file_bytes)
    except Exception as exc:  # noqa: BLE001 - surfaced to the uploader as a 400
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {exc}") from exc

    record_upload_audit(db, category, file.filename, result)
    recompute_health_for_app_dates(db, result.affected_app_dates)

    return {
        "rows_read": result.rows_read,
        "inserted": result.inserted,
        "updated": result.updated,
        "skipped": result.skipped,
        "errors": [{"row": e.row, "message": e.message} for e in result.errors],
        "affected_app_dates": len(result.affected_app_dates),
    }


@router.get("/history")
def upload_history(category: str | None = None, limit: int = 20, db: Session = Depends(get_db)):
    query = db.query(UploadAudit).order_by(UploadAudit.uploaded_at.desc())
    if category:
        query = query.filter(UploadAudit.category == category)
    rows = query.limit(limit).all()
    return [
        {
            "id": r.id,
            "category": r.category,
            "filename": r.filename,
            "uploaded_at": r.uploaded_at,
            "rows_read": r.rows_read,
            "rows_inserted": r.rows_inserted,
            "rows_updated": r.rows_updated,
            "rows_skipped": r.rows_skipped,
        }
        for r in rows
    ]
