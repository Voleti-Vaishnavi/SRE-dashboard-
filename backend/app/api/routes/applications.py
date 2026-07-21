from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Application, Team

router = APIRouter(prefix="/api/applications", tags=["applications"])


def _serialize(app: Application, team_name: str) -> dict:
    return {
        "id": app.id,
        "name": app.name,
        "team_id": app.team_id,
        "team_name": team_name,
        "medal_category": app.medal_category,
    }


@router.get("")
def list_applications(team_id: int | None = None, db: Session = Depends(get_db)) -> list[dict]:
    query = db.query(Application, Team.name).join(Team, Application.team_id == Team.id)
    if team_id is not None:
        query = query.filter(Application.team_id == team_id)
    query = query.order_by(Application.name)
    return [_serialize(app, team_name) for app, team_name in query.all()]


@router.get("/{application_id}")
def get_application(application_id: int, db: Session = Depends(get_db)) -> dict:
    row = (
        db.query(Application, Team.name)
        .join(Team, Application.team_id == Team.id)
        .filter(Application.id == application_id)
        .one_or_none()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Application not found")
    app, team_name = row
    return _serialize(app, team_name)
