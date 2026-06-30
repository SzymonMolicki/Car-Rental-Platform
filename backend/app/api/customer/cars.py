from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import require_customer
from app.core.time import utc_now
from app.core.database import get_db
from app.models.car import Car
from app.models.car_status import CarStatus
from app.schemas import CarResponse
from app.services.rental_lifecycle import check_car_availability_for_period, normalize_rental_day_range


router = APIRouter(tags=["customer"], dependencies=[Depends(require_customer)])

AVAILABLE_CAR_STATUS = "available"
EXCLUDED_CAR_STATUSES = ("maintenance", "unavailable")
CAR_RELATION_OPTIONS = (selectinload(Car.current_location), selectinload(Car.fuel_type), selectinload(Car.transmission), selectinload(Car.car_type), selectinload(Car.car_status))


@router.get("/cars", response_model=list[CarResponse])
def get_available_cars(
    start_date: date | None = None,
    planned_end_date: date | None = None,
    db: Session = Depends(get_db),
) -> list[Car]:
    """List cars currently marked available. If a date range is given instead,
    checks all cars (except those in maintenance/unavailable) for rentals
    overlapping that range rather than relying solely on current status."""
    if start_date is None or planned_end_date is None:
        return (
            db.execute(
                select(Car)
                .options(*CAR_RELATION_OPTIONS)
                .join(CarStatus, Car.car_status_id == CarStatus.car_status_id)
                .where(CarStatus.name == AVAILABLE_CAR_STATUS)
            )
            .scalars()
            .all()
        )

    if planned_end_date < start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planned_end_date must be on or after start_date")

    if start_date < utc_now().date():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="start_date cannot be in the past")

    all_cars = (
        db.execute(
            select(Car)
            .options(*CAR_RELATION_OPTIONS)
            .join(CarStatus, Car.car_status_id == CarStatus.car_status_id)
            .where(CarStatus.name.notin_(EXCLUDED_CAR_STATUSES))
        )
        .scalars()
        .all()
    )

    available_cars = []
    expired_reservations_cancelled = False
    start_datetime, planned_end_datetime = normalize_rental_day_range(start_date, planned_end_date)

    for car in all_cars:
        availability = check_car_availability_for_period(db, car.car_id, start_datetime, planned_end_datetime)
        expired_reservations_cancelled = expired_reservations_cancelled or availability.expired_reservations_cancelled

        if availability.is_available:
            available_cars.append(car)

    if expired_reservations_cancelled:
        db.commit()

    return available_cars
