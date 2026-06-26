from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CarCreate(BaseModel):
    current_location_id: UUID
    fuel_type_id: UUID
    transmission_id: UUID
    car_type_id: UUID
    car_status_id: UUID
    vin: str
    plate_number: str
    brand: str
    model: str
    production_year: int
    color: str
    seats: int
    mileage: int
    daily_rate: float


class CarUpdate(BaseModel):
    current_location_id: UUID | None = None
    fuel_type_id: UUID | None = None
    transmission_id: UUID | None = None
    car_type_id: UUID | None = None
    car_status_id: UUID | None = None
    vin: str | None = None
    plate_number: str | None = None
    brand: str | None = None
    model: str | None = None
    production_year: int | None = None
    color: str | None = None
    seats: int | None = None
    mileage: int | None = None
    daily_rate: float | None = None


class NamedReferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str


class CarResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    car_id: UUID
    current_location_id: UUID
    fuel_type_id: UUID
    transmission_id: UUID
    car_type_id: UUID
    car_status_id: UUID
    vin: str
    plate_number: str
    brand: str
    model: str
    production_year: int
    color: str
    seats: int
    mileage: int
    daily_rate: float
    created_at: datetime
    updated_at: datetime
    current_location: NamedReferenceResponse | None = None
    fuel_type: NamedReferenceResponse | None = None
    transmission: NamedReferenceResponse | None = None
    car_type: NamedReferenceResponse | None = None
    car_status: NamedReferenceResponse | None = None
