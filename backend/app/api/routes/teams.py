from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Team

router = APIRouter(prefix="/api/teams", tags=["teams"])


@router.get("")
def list_teams(db: Session = Depends(get_db)) -> list[dict]:
    teams = db.query(Team).order_by(Team.name).all()
    return [{"id": t.id, "name": t.name} for t in teams]
