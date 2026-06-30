from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_customer
from app.core.database import get_db
from app.core.time import utc_now
from app.models.car import Car
from app.models.car_status import CarStatus
from app.models.customer import Customer
from app.models.location import Location
from app.models.rental import Rental
from app.models.rental_status import RentalStatus
from app.schemas import CarRentalRequest, RentalResponse
from app.services.customer_validation import validate_customer_birth_date, validate_driver_license
from app.services.rental_lifecycle import check_car_availability_for_period, normalize_rental_day_range


router = APIRouter(tags=["customer"])

DEFAULT_RENTAL_STATUS = "reserved"
EXCLUDED_CAR_STATUSES = ("maintenance", "unavailable")


def _get_locked_car_or_404(db: Session, car_id: UUID) -> Car:
    car = db.execute(select(Car).where(Car.car_id == car_id).with_for_update()).scalar_one_or_none()

    if car is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    return car


def _validate_location(db: Session, location_id: UUID, label: str) -> None:
    if db.get(Location, location_id) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{label} not found")


@router.post("/rent", response_model=RentalResponse, status_code=status.HTTP_201_CREATED)
def rent_car(
    payload: CarRentalRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> Rental:
    now = utc_now()
    today = now.date()

    if payload.planned_end_date < payload.start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planned_end_date must be on or after start_date")

    if payload.start_date < today:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="start_date cannot be in the past")

    try:
        validate_customer_birth_date(current_customer.date_of_birth, today)
        validate_driver_license(current_customer.driver_license_no, current_customer.license_expiry_date, today)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    if current_customer.license_expiry_date is not None and current_customer.license_expiry_date < payload.planned_end_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Driver's license expires before the end of the rental")

    car = _get_locked_car_or_404(db, payload.car_id)
    car_status = db.get(CarStatus, car.car_status_id)

    if car_status is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Car status lookup value is missing")

    if car_status.name in EXCLUDED_CAR_STATUSES:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Car is not available for rental")

    _validate_location(db, payload.pickup_location_id, "Pickup location")
    _validate_location(db, payload.return_location_id, "Return location")

    start_datetime, planned_end_datetime = normalize_rental_day_range(payload.start_date, payload.planned_end_date)
    availability = check_car_availability_for_period(db, payload.car_id, start_datetime, planned_end_datetime, now=now)

    if not availability.is_available:
        if availability.expired_reservations_cancelled:
            db.commit()

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
        start_date=start_datetime,
        planned_end_date=planned_end_datetime,
    )

    db.add(rental)
    db.commit()
    db.refresh(rental)

    return rental
