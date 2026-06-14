from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    customer_id: UUID
    address_id: UUID
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    date_of_birth: date | None
    driver_license_no: str | None
    license_expiry_date: date | None
    created_at: datetime
    updated_at: datetime


class CustomerProfileResponse(CustomerResponse):
    street: str
    city: str
    postal_code: str
    country: str


class CustomerProfileUpdate(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=50)
    last_name: str | None = Field(None, min_length=1, max_length=50)
    email: EmailStr | None = None
    phone: str | None = Field(None, pattern=r"^\+?[0-9][0-9\s-]{7,20}$")
    date_of_birth: date | None = None
    driver_license_no: str | None = Field(None, max_length=50)
    license_expiry_date: date | None = None
    street: str | None = Field(None, min_length=1, max_length=100)
    city: str | None = Field(None, min_length=1, max_length=50)
    postal_code: str | None = Field(None, min_length=1, max_length=20)
    country: str | None = Field(None, min_length=1, max_length=50)
