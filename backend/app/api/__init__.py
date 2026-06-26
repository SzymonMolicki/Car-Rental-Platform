from app.api.admin.cars import router as admin_cars_router
from app.api.admin.customers import router as admin_customers_router
from app.api.admin.discounts import router as admin_discounts_router
from app.api.admin.lookups import router as admin_lookups_router
from app.api.admin.rentals import router as admin_rentals_router
from app.api.customer.cars import router as customer_cars_router
from app.api.customer.users import router as customer_users_router
from app.api.lookups import router as lookups_router
from app.api.login import router as login_router
from app.api.signup import router as signup_router
from app.api.customer.rent import router as customer_rentals_router
from app.api.customer.payment import router as customer_payment_router

__all__ = ["admin_cars_router", "admin_customers_router", "admin_discounts_router", "admin_lookups_router", "admin_rentals_router", "customer_cars_router", "customer_payment_router", "customer_rentals_router", "customer_users_router", "login_router", "lookups_router", "signup_router"]
