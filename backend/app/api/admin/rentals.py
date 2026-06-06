from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.core.database import get_db
from app.models.rental import Rental
from app.schemas import RentalResponse


router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/rentals", response_model=list[RentalResponse])
def get_rentals(db: Session = Depends(get_db)) -> list[Rental]:
    return db.execute(select(Rental)).scalars().all()


@router.get("/rentals/{rental_id}", response_model=RentalResponse)
def get_rental(rental_id: UUID, db: Session = Depends(get_db)) -> Rental:
    rental = db.get(Rental, rental_id)

    if rental is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rental not found")

    return rental
