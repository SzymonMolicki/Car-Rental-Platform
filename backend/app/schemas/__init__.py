from app.schemas.car import CarCreate, CarResponse, CarUpdate
from app.schemas.customer import CustomerProfileResponse, CustomerProfileUpdate, CustomerResponse
from app.schemas.discount import DiscountCreate, DiscountResponse, DiscountUpdate
from app.schemas.login import LoginRequest, TokenResponse
from app.schemas.rental import CarRentalRequest, RentalCreate, RentalHistoryResponse, RentalResponse
from app.schemas.signup import SignupRequest
from app.schemas.invoice import RentalPaymentRequest, InvoiceResponse

__all__ = ["CarCreate", "CarRentalRequest", "CarResponse", "CarUpdate", "CustomerProfileResponse", "CustomerProfileUpdate", "CustomerResponse", "DiscountCreate", "DiscountResponse", "DiscountUpdate", "LoginRequest", "RentalCreate", "RentalHistoryResponse", "RentalResponse", "SignupRequest", "TokenResponse", "RentalPaymentRequest", "InvoiceResponse"]