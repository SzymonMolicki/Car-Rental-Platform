from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

MIN_PRODUCTION_YEAR = 1886
CAR_UPDATE_NON_NULL_FIELDS = {
    "current_location_id",
    "fuel_type_id",
    "transmission_id",
    "car_type_id",
    "car_status_id",
    "vin",
    "plate_number",
    "brand",
    "model",
    "production_year",
    "color",
    "seats",
    "mileage",
    "daily_rate"
}


class CarBase(BaseModel):
    current_location_id: UUID
    fuel_type_id: UUID
    transmission_id: UUID
    car_type_id: UUID
    car_status_id: UUID
    vin: str = Field(..., min_length=1, max_length=50)
    plate_number: str = Field(..., min_length=1, max_length=20)
    brand: str = Field(..., min_length=1, max_length=50)
    model: str = Field(..., min_length=1, max_length=50)
    production_year: int
    color: str = Field(..., min_length=1, max_length=50)
    seats: int = Field(..., ge=1, le=60)
    mileage: int = Field(..., ge=0)
    daily_rate: Decimal = Field(..., gt=0, max_digits=10, decimal_places=2)

    @field_validator("vin", "plate_number", "brand", "model", "color", mode="before")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("production_year")
    @classmethod
    def validate_production_year(cls, value: int) -> int:
        max_year = date.today().year + 1

        if value < MIN_PRODUCTION_YEAR or value > max_year:
            raise ValueError(f"production_year must be between {MIN_PRODUCTION_YEAR} and {max_year}")

        return value


class CarCreate(CarBase):
    pass


class CarUpdate(BaseModel):
    current_location_id: UUID | None = None
    fuel_type_id: UUID | None = None
    transmission_id: UUID | None = None
    car_type_id: UUID | None = None
    car_status_id: UUID | None = None
    vin: str | None = Field(None, min_length=1, max_length=50)
    plate_number: str | None = Field(None, min_length=1, max_length=20)
    brand: str | None = Field(None, min_length=1, max_length=50)
    model: str | None = Field(None, min_length=1, max_length=50)
    production_year: int | None = None
    color: str | None = Field(None, min_length=1, max_length=50)
    seats: int | None = Field(None, ge=1, le=60)
    mileage: int | None = Field(None, ge=0)
    daily_rate: Decimal | None = Field(None, gt=0, max_digits=10, decimal_places=2)

    @field_validator("vin", "plate_number", "brand", "model", "color", mode="before")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("production_year")
    @classmethod
    def validate_production_year(cls, value: int | None) -> int | None:
        if value is None:
            return value

        max_year = date.today().year + 1

        if value < MIN_PRODUCTION_YEAR or value > max_year:
            raise ValueError(f"production_year must be between {MIN_PRODUCTION_YEAR} and {max_year}")

        return value

    @model_validator(mode="after")
    def reject_explicit_nulls(self) -> "CarUpdate":
        for field in CAR_UPDATE_NON_NULL_FIELDS:
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")

        return self


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
    daily_rate: Decimal
    created_at: datetime
    updated_at: datetime
    current_location: NamedReferenceResponse | None = None
    fuel_type: NamedReferenceResponse | None = None
    transmission: NamedReferenceResponse | None = None
    car_type: NamedReferenceResponse | None = None
    car_status: NamedReferenceResponse | None = None
