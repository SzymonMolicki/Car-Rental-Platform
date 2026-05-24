from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    date_of_birth: date
    driver_license_no: str
    license_expiry_date: date | None
    street: str
    city: str
    postal_code: str
    country: str
    created_at: datetime
    updated_at: datetime
