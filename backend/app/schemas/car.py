from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CarCreate(BaseModel):
    current_location_id: int | None = None
    vin: str | None = None
    plate_number: str | None = None
    brand: str
    model: str
    production_year: int
    color: str | None = None
    fuel_type: str | None = None
    transmission: str | None = None
    seats: int | None = None
    type: str | None = None
    mileage: int | None = None
    daily_rate: float
    status: str = "available"


class CarUpdate(BaseModel):
    current_location_id: int | None = None
    vin: str | None = None
    plate_number: str | None = None
    brand: str | None = None
    model: str | None = None
    production_year: int | None = None
    color: str | None = None
    fuel_type: str | None = None
    transmission: str | None = None
    seats: int | None = None
    type: str | None = None
    mileage: int | None = None
    daily_rate: float | None = None
    status: str | None = None


class CarResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    current_location_id: int | None
    vin: str | None
    plate_number: str | None
    brand: str
    model: str
    production_year: int
    color: str | None
    fuel_type: str | None
    transmission: str | None
    seats: int | None
    type: str | None
    mileage: int | None
    daily_rate: float
    status: str
    created_at: datetime
    updated_at: datetime
