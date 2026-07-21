from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.excel_templates import TEMPLATE_BUILDERS

router = APIRouter(prefix="/api/templates", tags=["templates"])

XLSX_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


@router.get("/{category}")
def download_template(category: str, db: Session = Depends(get_db)) -> Response:
    entry = TEMPLATE_BUILDERS.get(category)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Unknown template category '{category}'")

    builder, filename = entry
    content = builder(db)
    return Response(
        content=content,
        media_type=XLSX_MEDIA_TYPE,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
