from pydantic import BaseModel


class CarCreate(BaseModel):
    brand: str
    model: str
    production_year: int
    daily_rate: float
    status: str = "available"