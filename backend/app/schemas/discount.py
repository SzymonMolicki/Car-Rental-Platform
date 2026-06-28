from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

DISCOUNT_UPDATE_NON_NULL_FIELDS = {"name", "code", "percent_value", "is_active"}


class DiscountCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    percent_value: Decimal = Field(..., gt=0, le=100, max_digits=5, decimal_places=2)
    valid_from: datetime | None = None
    valid_to: datetime | None = None
    is_active: bool = True

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("code", mode="before")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip().upper()
        return value

    @model_validator(mode="after")
    def validate_date_range(self) -> "DiscountCreate":
        if self.valid_from is not None and self.valid_to is not None and self.valid_from > self.valid_to:
            raise ValueError("valid_from must be before or equal to valid_to")

        return self


class DiscountUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    code: str | None = Field(None, min_length=1, max_length=50)
    percent_value: Decimal | None = Field(None, gt=0, le=100, max_digits=5, decimal_places=2)
    valid_from: datetime | None = None
    valid_to: datetime | None = None
    is_active: bool | None = None

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("code", mode="before")
    @classmethod
    def normalize_code(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if isinstance(value, str):
            return value.strip().upper()
        return value

    @model_validator(mode="after")
    def validate_supplied_date_range(self) -> "DiscountUpdate":
        for field in DISCOUNT_UPDATE_NON_NULL_FIELDS:
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")

        if self.valid_from is not None and self.valid_to is not None and self.valid_from > self.valid_to:
            raise ValueError("valid_from must be before or equal to valid_to")

        return self


class DiscountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    discount_id: UUID
    name: str
    code: str
    percent_value: Decimal
    valid_from: datetime | None
    valid_to: datetime | None
    is_active: bool
    created_at: datetime
