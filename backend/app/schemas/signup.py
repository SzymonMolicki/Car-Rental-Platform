from datetime import datetime

from pydantic import BaseModel
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class SignupRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)
    phone: str = Field(..., pattern=r'^\+?1?\d{9,15}$')
    date_of_birth: Optional[datetime] = None
    driver_license_no: Optional[str] = Field(None, max_length=50)
    license_expiry_date: Optional[datetime] = None
    street: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=50)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=50)



