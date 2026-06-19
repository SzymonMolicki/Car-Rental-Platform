from app.api.customer.cars import router as customer_cars_router
from app.api.customer.users import router as customer_users_router
from app.api.customer.rent import router as customer_rentals_router


__all__ = ["customer_cars_router", "customer_users_router", "customer_rentals_router"]