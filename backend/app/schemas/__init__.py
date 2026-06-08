from app.schemas.car import CarCreate, CarResponse, CarUpdate
from app.schemas.customer import CustomerResponse
from app.schemas.discount import DiscountCreate, DiscountResponse, DiscountUpdate
from app.schemas.login import LoginRequest, TokenResponse
from app.schemas.rental import RentalCreate, RentalResponse
from app.schemas.signup import SignupRequest

__all__ = ["CarCreate", "CarResponse", "CarUpdate", "CustomerResponse", "DiscountCreate", "DiscountResponse", "DiscountUpdate", "LoginRequest", "RentalCreate", "RentalResponse", "SignupRequest", "TokenResponse"]
