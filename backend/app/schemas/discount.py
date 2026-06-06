from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DiscountCreate(BaseModel):
    name: str
    code: str
    percent_value: float
    valid_from: datetime | None = None
    valid_to: datetime | None = None
    is_active: bool = True


class DiscountUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    percent_value: float | None = None
    valid_from: datetime | None = None
    valid_to: datetime | None = None
    is_active: bool | None = None


class DiscountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    discount_id: UUID
    name: str
    code: str
    percent_value: float
    valid_from: datetime | None
    valid_to: datetime | None
    is_active: bool
    created_at: datetime
