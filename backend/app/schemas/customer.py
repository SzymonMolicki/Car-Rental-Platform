from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


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
