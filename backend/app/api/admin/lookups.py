from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.api.lookups import build_lookups_response
from app.core.database import get_db
from app.schemas import LookupsResponse


router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/lookups", response_model=LookupsResponse)
def get_admin_lookups(db: Session = Depends(get_db)) -> LookupsResponse:
    return build_lookups_response(db)
