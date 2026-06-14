from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_customer
from app.core.database import get_db
from app.models.car import Car
from app.models.car_status import CarStatus
from app.schemas import CarResponse


router = APIRouter(tags=["customer"], dependencies=[Depends(require_customer)])


@router.get("/cars", response_model=list[CarResponse])
def get_available_cars(db: Session = Depends(get_db)) -> list[Car]:
    return db.execute(select(Car).join(CarStatus, Car.car_status_id == CarStatus.car_status_id).where(CarStatus.name == "available").order_by(Car.brand, Car.model, Car.production_year)).scalars().all()
