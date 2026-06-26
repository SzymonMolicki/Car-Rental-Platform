from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.customer.rent import _car_is_available
from app.api.dependencies import require_customer
from app.core.database import get_db
from app.models.car import Car
from app.models.car_status import CarStatus
from app.schemas import CarResponse


router = APIRouter(tags=["customer"], dependencies=[Depends(require_customer)])

AVAILABLE_CAR_STATUS = "available"
EXCLUDED_CAR_STATUSES = ("maintenance", "unavailable")
CAR_RELATION_OPTIONS = (selectinload(Car.current_location), selectinload(Car.fuel_type), selectinload(Car.transmission), selectinload(Car.car_type), selectinload(Car.car_status))


@router.get("/cars", response_model=list[CarResponse])
def get_available_cars(
    start_date: datetime | None = None,
    planned_end_date: datetime | None = None,
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

    if planned_end_date <= start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planned_end_date must be after start_date")

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

    return [car for car in all_cars if _car_is_available(db, car.car_id, start_date, planned_end_date)]
