from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_customer
from app.core.database import get_db
from app.core.time import utc_now
from app.models.car import Car
from app.models.customer import Customer
from app.models.rental import Rental
from app.models.rental_status import RentalStatus
from app.schemas import CarRentalRequest, RentalResponse
from app.services.rental_lifecycle import is_reservation_hold_active


router = APIRouter(tags=["customer"])

BLOCKING_RENTAL_STATUSES = ("reserved", "active")
DEFAULT_RENTAL_STATUS = "reserved"


def _car_is_available(db: Session, car_id: UUID, start_date: datetime, planned_end_date: datetime, *, now: datetime | None = None) -> bool:
    """A rental blocks the car for [start_date, effective_end), where effective_end
    is the actual return time if known, otherwise the planned return time."""
    now = now or utc_now()
    effective_end = func.coalesce(Rental.actual_end_date, Rental.planned_end_date)

    conflicts = db.execute(
        select(Rental, RentalStatus.name)
        .join(RentalStatus, Rental.rental_status_id == RentalStatus.rental_status_id)
        .where(
            Rental.car_id == car_id,
            RentalStatus.name.in_(BLOCKING_RENTAL_STATUSES),
            Rental.start_date < planned_end_date,
            effective_end > start_date,
        )
    ).all()

    for rental, status_name in conflicts:
        if status_name != "reserved":
            return False

        if is_reservation_hold_active(created_at=rental.created_at, now=now):
            return False

    return True


@router.post("/rent", response_model=RentalResponse, status_code=status.HTTP_201_CREATED)
def rent_car(
    payload: CarRentalRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> Rental:
    if payload.planned_end_date <= payload.start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planned_end_date must be after start_date")

    car = db.get(Car, payload.car_id)
    if car is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    now = utc_now()
    if not _car_is_available(db, payload.car_id, payload.start_date, payload.planned_end_date, now=now):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Car is not available for the selected dates")

    reserved_status = db.execute(
        select(RentalStatus).where(RentalStatus.name == DEFAULT_RENTAL_STATUS)
    ).scalar_one()

    rental = Rental(
        customer_id=current_customer.customer_id,
        car_id=payload.car_id,
        pickup_location_id=payload.pickup_location_id,
        return_location_id=payload.return_location_id,
        rental_status_id=reserved_status.rental_status_id,
        start_date=payload.start_date,
        planned_end_date=payload.planned_end_date,
    )

    db.add(rental)
    db.commit()
    db.refresh(rental)

    return rental