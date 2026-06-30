from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.core.database import get_db
from app.models.customer import Customer
from app.schemas import CustomerResponse
from app.services.deletion import delete_customer_with_related_records


router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/customers", response_model=list[CustomerResponse])
def get_customers(db: Session = Depends(get_db)) -> list[Customer]:
    return db.execute(select(Customer)).scalars().all()


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: UUID, db: Session = Depends(get_db)) -> Customer:
    customer = db.get(Customer, customer_id)

    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    return customer


@router.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: UUID, db: Session = Depends(get_db)) -> None:
    customer = db.get(Customer, customer_id)

    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    delete_customer_with_related_records(db, customer)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Customer cannot be deleted because it is used by existing records") from exc
