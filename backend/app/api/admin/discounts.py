from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.core.database import get_db
from app.models.discount import Discount
from app.schemas import DiscountCreate, DiscountResponse, DiscountUpdate


router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


def _validate_discount_date_range(valid_from, valid_to) -> None:
    if valid_from is not None and valid_to is not None and valid_from > valid_to:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="valid_from must be before or equal to valid_to")


@router.get("/discounts", response_model=list[DiscountResponse])
def get_discounts(db: Session = Depends(get_db)) -> list[Discount]:
    return db.execute(select(Discount)).scalars().all()


@router.get("/discounts/{discount_id}", response_model=DiscountResponse)
def get_discount(discount_id: UUID, db: Session = Depends(get_db)) -> Discount:
    discount = db.get(Discount, discount_id)

    if discount is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discount not found")

    return discount


@router.post("/discounts", response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
def create_discount(discount: DiscountCreate, db: Session = Depends(get_db)) -> Discount:
    new_discount = Discount(**discount.model_dump())
    db.add(new_discount)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Discount code already exists") from exc
    db.refresh(new_discount)

    return new_discount


@router.delete("/discounts/{discount_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_discount(discount_id: UUID, db: Session = Depends(get_db)) -> None:
    discount = db.get(Discount, discount_id)

    if discount is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discount not found")

    db.delete(discount)
    db.commit()


@router.patch("/discounts/{discount_id}", response_model=DiscountResponse)
def update_discount(discount_id: UUID, discount_data: DiscountUpdate, db: Session = Depends(get_db)) -> Discount:
    discount = db.get(Discount, discount_id)

    if discount is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discount not found")

    update_data = discount_data.model_dump(exclude_unset=True)
    valid_from = update_data.get("valid_from", discount.valid_from)
    valid_to = update_data.get("valid_to", discount.valid_to)
    _validate_discount_date_range(valid_from, valid_to)

    for field, value in update_data.items():
        setattr(discount, field, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Discount code already exists") from exc
    db.refresh(discount)

    return discount
