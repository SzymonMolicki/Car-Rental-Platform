from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import *


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(login_router)
app.include_router(admin_cars_router)
app.include_router(admin_customers_router)
app.include_router(admin_discounts_router)
app.include_router(admin_rentals_router)
app.include_router(customer_cars_router)
app.include_router(customer_users_router)
app.include_router(signup_router)
app.include_router(customer_rentals_router)
app.include_router(customer_payment_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "System is running"}
