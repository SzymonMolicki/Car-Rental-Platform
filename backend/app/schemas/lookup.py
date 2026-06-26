from uuid import UUID

from pydantic import BaseModel


class LookupItemResponse(BaseModel):
    id: UUID
    name: str


class LookupsResponse(BaseModel):
    car_statuses: list[LookupItemResponse]
    car_types: list[LookupItemResponse]
    fuel_types: list[LookupItemResponse]
    invoice_statuses: list[LookupItemResponse]
    locations: list[LookupItemResponse]
    payment_methods: list[LookupItemResponse]
    payment_statuses: list[LookupItemResponse]
    rental_statuses: list[LookupItemResponse]
    transmissions: list[LookupItemResponse]
