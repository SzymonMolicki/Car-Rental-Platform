from dataclasses import dataclass
from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import TypeVar

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.address import Address
from app.models.car import Car
from app.models.car_status import CarStatus
from app.models.car_type import CarType
from app.models.customer import Customer
from app.models.discount import Discount
from app.models.fuel_type import FuelType
from app.models.invoice import Invoice
from app.models.invoice_status import InvoiceStatus
from app.models.location import Location
from app.models.payment_method import PaymentMethod
from app.models.payment_status import PaymentStatus
from app.models.rental import Rental
from app.models.rental_status import RentalStatus
from app.models.transmission import Transmission


T = TypeVar("T")

CAR_COUNT = 50
CUSTOMER_COUNT = 100
RENTAL_COUNT = 150

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


@dataclass(frozen=True)
class LocationSeed:
    key: str
    city: str
    street: str
    postal_code: str
    name: str
    phone: str
    email: str
    plate_prefix: str


@dataclass(frozen=True)
class CarModelSeed:
    brand: str
    model: str
    car_type: str
    fuel_type: str
    transmission: str
    seats: int
    daily_rate: Decimal


@dataclass(frozen=True)
class DiscountSeed:
    name: str
    code: str
    percent_value: Decimal


LOOKUP_DATA = {
    CarStatus: ["available", "rented", "maintenance", "unavailable"],
    CarType: ["economy", "compact", "sedan", "suv", "van", "luxury"],
    FuelType: ["petrol", "diesel", "hybrid", "electric"],
    InvoiceStatus: ["draft", "issued", "cancelled", "paid"],
    PaymentMethod: ["Blik", "card", "Apple Pay", "Google Pay"],
    PaymentStatus: ["pending", "paid", "failed"],
    RentalStatus: ["reserved", "active", "completed", "cancelled"],
    Transmission: ["manual", "automatic"]
}

LOCATION_SEEDS = (
    LocationSeed("katowice", "Katowice", "Korfantego Avenue 2", "40-004", "Katowice City Center", "+48 500 100 100", "katowice.city-center@example.com", "SK"),
    LocationSeed("gliwice", "Gliwice", "Zwyciestwa Street 28", "44-100", "Gliwice Railway Hub", "+48 500 100 101", "gliwice.railway-hub@example.com", "SG"),
    LocationSeed("sosnowiec", "Sosnowiec", "Third May Street 23", "41-200", "Sosnowiec Business Park", "+48 500 100 102", "sosnowiec.business-park@example.com", "SO"),
    LocationSeed("zabrze", "Zabrze", "Freedom Avenue 273", "41-800", "Zabrze Technology Park", "+48 500 100 103", "zabrze.technology-park@example.com", "SZ"),
    LocationSeed("bytom", "Bytom", "Market Square 7", "41-902", "Bytom Old Market", "+48 500 100 104", "bytom.old-market@example.com", "SY"),
    LocationSeed("chorzow", "Chorzów", "Park Street 12", "41-500", "Chorzów Stadium District", "+48 500 100 105", "chorzow.stadium-district@example.com", "SH"),
    LocationSeed("tychy", "Tychy", "Industrial Avenue 15", "43-100", "Tychy Logistics Center", "+48 500 100 106", "tychy.logistics-center@example.com", "ST"),
    LocationSeed("dabrowa-gornicza", "Dąbrowa Górnicza", "Central Avenue 18", "41-300", "Dąbrowa Górnicza Central Plaza", "+48 500 100 107", "dabrowa.central-plaza@example.com", "SD"),
    LocationSeed("ruda-slaska", "Ruda Śląska", "Transit Street 4", "41-709", "Ruda Śląska Transit Point", "+48 500 100 108", "ruda-slaska.transit-point@example.com", "SL"),
    LocationSeed("siemianowice-slaskie", "Siemianowice Śląskie", "Business Street 9", "41-100", "Siemianowice Śląskie Business Quarter", "+48 500 100 109", "siemianowice.business-quarter@example.com", "SI"),
    LocationSeed("piekary-slaskie", "Piekary Śląskie", "Service Road 11", "41-940", "Piekary Śląskie Service Hub", "+48 500 100 110", "piekary.service-hub@example.com", "SPI"),
    LocationSeed("myslowice", "Mysłowice", "Gateway Street 6", "41-400", "Mysłowice Gateway", "+48 500 100 111", "myslowice.gateway@example.com", "SM")
)

CAR_MODEL_SEEDS = (
    CarModelSeed("Toyota", "Yaris", "economy", "petrol", "manual", 5, Decimal("109.00")),
    CarModelSeed("Renault", "Clio", "economy", "petrol", "manual", 5, Decimal("115.00")),
    CarModelSeed("Peugeot", "208", "economy", "petrol", "manual", 5, Decimal("119.00")),
    CarModelSeed("Toyota", "Corolla", "compact", "petrol", "manual", 5, Decimal("149.00")),
    CarModelSeed("Volkswagen", "Golf", "compact", "diesel", "manual", 5, Decimal("159.00")),
    CarModelSeed("Kia", "Ceed", "compact", "petrol", "automatic", 5, Decimal("165.00")),
    CarModelSeed("Hyundai", "i30", "compact", "hybrid", "automatic", 5, Decimal("179.00")),
    CarModelSeed("Ford", "Focus", "compact", "petrol", "manual", 5, Decimal("155.00")),
    CarModelSeed("Opel", "Astra", "compact", "diesel", "manual", 5, Decimal("152.00")),
    CarModelSeed("Skoda", "Octavia", "sedan", "diesel", "automatic", 5, Decimal("185.00")),
    CarModelSeed("Skoda", "Superb", "sedan", "hybrid", "automatic", 5, Decimal("215.00")),
    CarModelSeed("BMW", "3 Series", "luxury", "diesel", "automatic", 5, Decimal("279.00")),
    CarModelSeed("Mercedes-Benz", "C-Class", "luxury", "petrol", "automatic", 5, Decimal("299.00")),
    CarModelSeed("Tesla", "Model 3", "luxury", "electric", "automatic", 5, Decimal("329.00")),
    CarModelSeed("Nissan", "Leaf", "compact", "electric", "automatic", 5, Decimal("189.00")),
    CarModelSeed("Hyundai", "Tucson", "suv", "hybrid", "automatic", 5, Decimal("229.00")),
    CarModelSeed("Kia", "Sportage", "suv", "diesel", "automatic", 5, Decimal("219.00")),
    CarModelSeed("Volkswagen", "Tiguan", "suv", "petrol", "automatic", 5, Decimal("235.00")),
    CarModelSeed("Volvo", "XC60", "luxury", "hybrid", "automatic", 5, Decimal("349.00")),
    CarModelSeed("Renault", "Trafic", "van", "diesel", "manual", 9, Decimal("249.00"))
)

DISCOUNT_SEEDS = (
    DiscountSeed("Welcome discount 10%", "WELCOME10", Decimal("10.00")),
    DiscountSeed("Weekend discount 15%", "WEEKEND15", Decimal("15.00")),
    DiscountSeed("Welcome discount 12%", "WELCOME12", Decimal("12.00")),
    DiscountSeed("Business account discount 20%", "BUSINESS20", Decimal("20.00")),
    DiscountSeed("Loyal customer discount 5%", "LOYALTY5", Decimal("5.00"))
)

FIRST_NAMES = ("Alice", "Daniel", "Sophia", "Oliver", "Emma", "Lucas", "Mia", "Henry", "Amelia", "Noah", "Grace", "Leo", "Ella", "Oscar", "Lily", "Adam", "Nora", "Ethan", "Ruby", "Mason")

LAST_NAMES = ("Morgan", "Brooks", "Reed", "Carter", "Parker", "Bennett", "Foster", "Hayes", "Turner", "Cooper", "Walker", "Hughes", "Bailey", "Collins", "Richardson", "Stewart", "Powell", "Sanders", "Mitchell", "Ward", "Murphy", "Bell", "Gray", "James", "Wood")

CUSTOMER_STREETS = ("Residential Street", "Garden Lane", "Oak Avenue", "Maple Street", "Station Road", "River Street", "Hill Avenue", "Green Lane", "Central Street", "Office Road", "North Avenue", "South Street")

CAR_COLORS = ("white", "black", "gray", "silver", "blue", "red", "green", "navy", "orange", "brown")
PAYMENT_METHODS = ("card", "Blik", "Apple Pay", "Google Pay")


def _get_by_field(db: Session, model: type[T], field_name: str, value: object) -> T | None:
    return db.execute(select(model).where(getattr(model, field_name) == value)).scalars().first()


def _money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _get_or_create_by_name(db: Session, model: type[T], name: str) -> T:
    existing = _get_by_field(db, model, "name", name)

    if existing is not None:
        return existing

    instance = model(name=name)
    db.add(instance)
    db.flush()
    return instance


def _get_or_create_address(db: Session, *, street: str, city: str, postal_code: str, country: str) -> Address:
    existing = (db.execute(select(Address).where(Address.street == street, Address.city == city, Address.postal_code == postal_code, Address.country == country)).scalars().first())

    if existing is not None:
        return existing

    address = Address(street=street, city=city, postal_code=postal_code, country=country)
    db.add(address)
    db.flush()
    return address


def _get_or_create_location(db: Session, *, address: Address, name: str, phone: str, email: str) -> Location:
    existing = _get_by_field(db, Location, "email", email)

    if existing is not None:
        existing.address_id = address.address_id
        existing.name = name
        existing.phone = phone
        return existing

    location = Location(address_id=address.address_id, name=name, phone=phone, email=email)
    db.add(location)
    db.flush()
    return location


def _get_or_create_customer(db: Session, *, address: Address, first_name: str, last_name: str, email: str, phone: str, date_of_birth: date, driver_license_no: str, license_expiry_date: date) -> Customer:
    existing = _get_by_field(db, Customer, "email", email)

    if existing is not None:
        existing.address_id = address.address_id
        existing.first_name = first_name
        existing.last_name = last_name
        existing.phone = phone
        existing.date_of_birth = date_of_birth
        existing.driver_license_no = driver_license_no
        existing.license_expiry_date = license_expiry_date
        return existing

    customer = Customer(
        address_id=address.address_id,
        first_name=first_name,
        last_name=last_name,
        email=email,
        password_hash=pwd_context.hash("Password123!"),
        phone=phone,
        date_of_birth=date_of_birth,
        driver_license_no=driver_license_no,
        license_expiry_date=license_expiry_date
    )
    db.add(customer)
    db.flush()
    return customer


def _get_or_create_car(db: Session, *, current_location: Location, fuel_type: FuelType, transmission: Transmission,
                       car_type: CarType, car_status: CarStatus, vin: str, plate_number: str, brand: str, model: str,
                       production_year: int, color: str, seats: int, mileage: int, daily_rate: Decimal) -> Car:
    existing = _get_by_field(db, Car, "vin", vin)

    if existing is not None:
        existing.current_location_id = current_location.location_id
        existing.fuel_type_id = fuel_type.fuel_type_id
        existing.transmission_id = transmission.transmission_id
        existing.car_type_id = car_type.car_type_id
        existing.car_status_id = car_status.car_status_id
        existing.plate_number = plate_number
        existing.brand = brand
        existing.model = model
        existing.production_year = production_year
        existing.color = color
        existing.seats = seats
        existing.mileage = mileage
        existing.daily_rate = daily_rate
        return existing

    car = Car(
        current_location_id=current_location.location_id,
        fuel_type_id=fuel_type.fuel_type_id,
        transmission_id=transmission.transmission_id,
        car_type_id=car_type.car_type_id,
        car_status_id=car_status.car_status_id,
        vin=vin,
        plate_number=plate_number,
        brand=brand,
        model=model,
        production_year=production_year,
        color=color,
        seats=seats,
        mileage=mileage,
        daily_rate=daily_rate
    )
    db.add(car)
    db.flush()
    return car


def _get_or_create_discount(db: Session, *, name: str, code: str, percent_value: Decimal, valid_from: datetime, valid_to: datetime, is_active: bool) -> Discount:
    existing = _get_by_field(db, Discount, "code", code)

    if existing is not None:
        existing.name = name
        existing.percent_value = percent_value
        existing.valid_from = valid_from
        existing.valid_to = valid_to
        existing.is_active = is_active
        return existing

    discount = Discount(name=name, code=code, percent_value=percent_value, valid_from=valid_from, valid_to=valid_to, is_active=is_active)
    db.add(discount)
    db.flush()
    return discount


def _get_or_create_rental_with_invoice(db: Session, *, invoice_number: str, invoice_issue_date: date,
                                       customer: Customer, car: Car, pickup_location: Location,
                                       return_location: Location, rental_status: RentalStatus, start_date: datetime,
                                       planned_end_date: datetime, actual_end_date: datetime | None,
                                       invoice_status: InvoiceStatus, payment_status: PaymentStatus,
                                       payment_method: PaymentMethod | None, discount: Discount | None,
                                       base_amount: Decimal, discount_amount: Decimal, total_amount: Decimal,
                                       paid_at: datetime | None) -> Rental:
    existing_invoice = _get_by_field(db, Invoice, "invoice_number", invoice_number)

    if existing_invoice is not None:
        rental = db.get(Rental, existing_invoice.rental_id)
        if rental is None:
            raise RuntimeError(f"Invoice {invoice_number} points to missing rental")

        rental.customer_id = customer.customer_id
        rental.car_id = car.car_id
        rental.pickup_location_id = pickup_location.location_id
        rental.return_location_id = return_location.location_id
        rental.rental_status_id = rental_status.rental_status_id
        rental.start_date = start_date
        rental.planned_end_date = planned_end_date
        rental.actual_end_date = actual_end_date
        existing_invoice.discount_id = discount.discount_id if discount is not None else None
        existing_invoice.invoice_status_id = invoice_status.invoice_status_id
        existing_invoice.payment_method_id = payment_method.payment_method_id if payment_method is not None else None
        existing_invoice.payment_status_id = payment_status.payment_status_id
        existing_invoice.invoice_issue_date = invoice_issue_date
        existing_invoice.base_amount = base_amount
        existing_invoice.discount_amount = discount_amount
        existing_invoice.total_amount = total_amount
        existing_invoice.paid_at = paid_at
        db.flush()
        return rental

    rental = Rental(
        customer_id=customer.customer_id,
        car_id=car.car_id,
        pickup_location_id=pickup_location.location_id,
        return_location_id=return_location.location_id,
        rental_status_id=rental_status.rental_status_id,
        start_date=start_date,
        planned_end_date=planned_end_date,
        actual_end_date=actual_end_date
    )
    db.add(rental)
    db.flush()

    invoice = Invoice(
        rental_id=rental.rental_id,
        discount_id=discount.discount_id if discount is not None else None,
        invoice_status_id=invoice_status.invoice_status_id,
        payment_method_id=payment_method.payment_method_id if payment_method is not None else None,
        payment_status_id=payment_status.payment_status_id,
        invoice_number=invoice_number,
        invoice_issue_date=invoice_issue_date,
        base_amount=base_amount,
        discount_amount=discount_amount,
        total_amount=total_amount,
        paid_at=paid_at
    )
    db.add(invoice)
    db.flush()
    return rental


def _seed_locations(db: Session) -> list[Location]:
    locations = []

    for seed in LOCATION_SEEDS:
        address = _get_or_create_address(db, street=seed.street, city=seed.city, postal_code=seed.postal_code, country="Poland")
        locations.append(_get_or_create_location(db, address=address, name=seed.name, phone=seed.phone, email=seed.email))

    return locations


def _customer_email(index: int, first_name: str, last_name: str) -> str:
    legacy_emails = {0: "alice.morgan@example.com", 1: "daniel.brooks@example.com", 2: "sophia.reed@example.com"}

    return legacy_emails.get(index, f"{first_name.lower()}.{last_name.lower()}.{index + 1:03d}@example.com")


def _seed_customers(db: Session) -> list[Customer]:
    customers = []

    for index in range(CUSTOMER_COUNT):
        location_seed = LOCATION_SEEDS[index % len(LOCATION_SEEDS)]
        first_name = FIRST_NAMES[index % len(FIRST_NAMES)]
        last_name = LAST_NAMES[(index * 7) % len(LAST_NAMES)]
        birth_month = (index % 12) + 1
        birth_day = (index % 27) + 1
        address = _get_or_create_address(db, street=f"{CUSTOMER_STREETS[index % len(CUSTOMER_STREETS)]} {index + 1}", city=location_seed.city, postal_code=location_seed.postal_code, country="Poland")
        customers.append(
            _get_or_create_customer(
                db,
                address=address,
                first_name=first_name,
                last_name=last_name,
                email=_customer_email(index, first_name, last_name),
                phone=f"+48 600 {100 + index:03d} {200 + index:03d}",
                date_of_birth=date(1975 + (index % 30), birth_month, birth_day),
                driver_license_no=f"GZM{index + 1:07d}",
                license_expiry_date=date(2029 + (index % 8), birth_month, birth_day)
            )
        )

    return customers


def _rental_car_index(index: int) -> int:
    return (index * 7 + 3) % CAR_COUNT


def _active_car_indexes() -> set[int]:
    return {_rental_car_index(index) for index in range(90, 120)}


def _car_status_name(index: int, active_car_indexes: set[int]) -> str:
    if index in active_car_indexes:
        return "rented"
    return "available"


def _seed_cars(db: Session, lookups: dict[type[object], dict[str, object]], locations: list[Location]) -> list[Car]:
    cars = []
    active_car_indexes = _active_car_indexes()

    for index in range(CAR_COUNT):
        model_seed = CAR_MODEL_SEEDS[index % len(CAR_MODEL_SEEDS)]
        location_index = index % len(locations)
        location_seed = LOCATION_SEEDS[location_index]
        cars.append(
            _get_or_create_car(
                db,
                current_location=locations[location_index],
                fuel_type=lookups[FuelType][model_seed.fuel_type],
                transmission=lookups[Transmission][model_seed.transmission],
                car_type=lookups[CarType][model_seed.car_type],
                car_status=lookups[CarStatus][_car_status_name(index, active_car_indexes)],
                vin=f"GZMRENTAL{index + 1:08d}",
                plate_number=f"{location_seed.plate_prefix}{1000 + index}D",
                brand=model_seed.brand,
                model=model_seed.model,
                production_year=2019 + (index % 7),
                color=CAR_COLORS[index % len(CAR_COLORS)],
                seats=model_seed.seats,
                mileage=5_000 + (index * 1_375) + ((index % 7) * 320),
                daily_rate=model_seed.daily_rate
            )
        )

    return cars


def _seed_discounts(db: Session, now: datetime) -> list[Discount]:
    return [_get_or_create_discount(db, name=seed.name, code=seed.code, percent_value=seed.percent_value, valid_from=now - timedelta(days=60), valid_to=now + timedelta(days=365), is_active=True) for seed in DISCOUNT_SEEDS]


def _rental_status_name(index: int) -> str:
    if index < 90:
        return "completed"
    if index < 120:
        return "active"
    return "reserved"


def _rental_day_count(start_date: datetime, planned_end_date: datetime) -> int:
    return max((planned_end_date.date() - start_date.date()).days + 1, 1)


def _rental_dates(index: int, now: datetime) -> tuple[datetime, datetime, datetime | None]:
    duration_days = 1 + (index % 10)
    status_name = _rental_status_name(index)

    if status_name == "completed":
        start_date = now - timedelta(days=180 - index, hours=index % 8)
        planned_end_date = start_date + timedelta(days=duration_days)
        actual_end_date = planned_end_date - timedelta(hours=index % 6)
        return start_date, planned_end_date, actual_end_date

    if status_name == "active":
        start_date = now - timedelta(days=1 + (index % 4), hours=index % 6)
        planned_end_date = now + timedelta(days=1 + (index % 5), hours=2)
        return start_date, planned_end_date, None

    if status_name == "reserved":
        start_date = now + timedelta(days=7 + (index - 120), hours=10)
        planned_end_date = start_date + timedelta(days=duration_days)
        return start_date, planned_end_date, None

    raise RuntimeError(f"Unsupported rental status: {status_name}")


def _invoice_state(index: int, lookups: dict[type[object], dict[str, object]], start_date: datetime, actual_end_date: datetime | None, now: datetime) -> tuple[InvoiceStatus, PaymentStatus, PaymentMethod | None, datetime | None]:
    if actual_end_date is not None:
        paid_at = actual_end_date + timedelta(hours=1)
    else:
        paid_at = min(start_date - timedelta(hours=2), now)

    return (lookups[InvoiceStatus]["paid"], lookups[PaymentStatus]["paid"], lookups[PaymentMethod][PAYMENT_METHODS[index % len(PAYMENT_METHODS)]], paid_at)


def _seed_rentals(db: Session, lookups: dict[type[object], dict[str, object]], *, customers: list[Customer], cars: list[Car], locations: list[Location], discounts: list[Discount], now: datetime) -> None:
    for index in range(RENTAL_COUNT):
        status_name = _rental_status_name(index)
        car = cars[_rental_car_index(index)]
        start_date, planned_end_date, actual_end_date = _rental_dates(index, now)
        invoice_status, payment_status, payment_method, paid_at = _invoice_state(index, lookups, start_date, actual_end_date, now)
        discount = discounts[index % len(discounts)] if index % 4 == 0 else None
        base_amount = _money(car.daily_rate * _rental_day_count(start_date, planned_end_date))
        discount_amount = _money(base_amount * discount.percent_value / Decimal("100")) if discount is not None else Decimal("0.00")

        _get_or_create_rental_with_invoice(
            db,
            invoice_number=f"INV/GZM/2026/{index + 1:04d}",
            invoice_issue_date=paid_at.date(),
            customer=customers[(index * 3) % len(customers)],
            car=car,
            pickup_location=locations[index % len(locations)],
            return_location=locations[(index + 3) % len(locations)],
            rental_status=lookups[RentalStatus][status_name],
            start_date=start_date,
            planned_end_date=planned_end_date,
            actual_end_date=actual_end_date,
            invoice_status=invoice_status,
            payment_status=payment_status,
            payment_method=payment_method,
            discount=discount,
            base_amount=base_amount,
            discount_amount=discount_amount,
            total_amount=_money(base_amount - discount_amount),
            paid_at=paid_at
        )


def seed_database() -> None:
    with SessionLocal() as db:
        now = datetime.now().replace(microsecond=0)
        lookups = {model: {name: _get_or_create_by_name(db, model, name) for name in names} for model, names in LOOKUP_DATA.items()}

        locations = _seed_locations(db)
        customers = _seed_customers(db)
        cars = _seed_cars(db, lookups, locations)
        discounts = _seed_discounts(db, now)
        _seed_rentals(db, lookups, customers=customers, cars=cars, locations=locations, discounts=discounts, now=now)

        db.commit()

    print("Seed data inserted")

if __name__ == "__main__":
    seed_database()
