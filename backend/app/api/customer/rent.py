from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_customer
from app.core.database import get_db
from app.models.car import Car
from app.models.car_status import CarStatus
from app.models.customer import Customer
from app.models.rental import Rental
from app.models.rental_status import RentalStatus
from app.schemas import CarResponse, CarRentalRequest, RentalResponse
from app.api.dependencies import get_current_customer


router = APIRouter(prefix="/customer", tags=["customer"])

AVAILABLE_CAR_STATUS = "available"
BLOCKING_RENTAL_STATUSES = ("reserved", "active")
DEFAULT_RENTAL_STATUS = "reserved"


def _car_is_available(db: Session, car_id: UUID, start_date: datetime, planned_end_date: datetime) -> bool:
    conflict = db.execute(
        select(Rental.rental_id)
        .join(RentalStatus, Rental.rental_status_id == RentalStatus.rental_status_id)
        .where(
            Rental.car_id == car_id,
            RentalStatus.name.in_(BLOCKING_RENTAL_STATUSES),
            Rental.start_date < planned_end_date,
            or_(Rental.planned_end_date > start_date, Rental.actual_end_date.is_(None)),
        )
    ).first()
    return conflict is None


@router.get("/cars", response_model=list[CarResponse])
def get_available_cars(
    start_date: datetime | None = None,
    planned_end_date: datetime | None = None,
    db: Session = Depends(get_db),
) -> list[Car]:
    """List cars currently marked available. If a date range is given, also
    filters out cars with a reserved/active rental overlapping that range."""
    cars = (
        db.execute(
            select(Car)
            .join(CarStatus, Car.car_status_id == CarStatus.car_status_id)
            .where(CarStatus.name == AVAILABLE_CAR_STATUS)
        )
        .scalars()
        .all()
    )

    if start_date is None or planned_end_date is None:
        return cars

    if planned_end_date <= start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planned_end_date must be after start_date")

    return [car for car in cars if _car_is_available(db, car.car_id, start_date, planned_end_date)]


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

    if not _car_is_available(db, payload.car_id, payload.start_date, payload.planned_end_date):
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