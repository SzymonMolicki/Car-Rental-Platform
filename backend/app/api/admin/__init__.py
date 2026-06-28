from app.api.admin.cars import router as admin_cars_router
from app.api.admin.customers import router as admin_customers_router
from app.api.admin.discounts import router as admin_discounts_router
from app.api.admin.lookups import router as admin_lookups_router
from app.api.admin.rentals import router as admin_rentals_router


__all__ = ["admin_cars_router", "admin_customers_router", "admin_discounts_router", "admin_lookups_router", "admin_rentals_router"]
