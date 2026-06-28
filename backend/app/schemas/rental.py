from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class RentalCreate(BaseModel):
    customer_id: UUID
    car_id: UUID
    pickup_location_id: UUID
    return_location_id: UUID
    rental_status_id: UUID
    start_date: datetime
    planned_end_date: datetime
    actual_end_date: datetime | None = None


class RentalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rental_id: UUID
    customer_id: UUID
    car_id: UUID
    pickup_location_id: UUID
    return_location_id: UUID
    rental_status_id: UUID
    start_date: datetime
    planned_end_date: datetime
    actual_end_date: datetime | None
    created_at: datetime


class RentalHistoryResponse(BaseModel):
    rental_id: UUID
    car_id: UUID
    car: str
    plate_number: str
    status: str
    has_invoice: bool
    pickup_location: str
    return_location: str
    start_date: datetime
    planned_end_date: datetime
    actual_end_date: datetime | None
    created_at: datetime


class CarRentalRequest(BaseModel):
    car_id: UUID
    pickup_location_id: UUID
    return_location_id: UUID
    start_date: date
    planned_end_date: date
