# Metrocars

Metrocars is a FastAPI and React application for operating a car rental company of the same name. It supports customer registration and login, browsing available cars, creating and paying for rentals, profile management, rental history, invoice downloads and an administrative panel for fleet, customer, discount and rental management.

---

## Technology Stack

- Python 3.12
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- React
- Vite
- Docker Compose

---

## Services

The application runs as three Docker Compose services:

- `frontend` - React/Vite application on port `5173`
- `backend` - FastAPI application on port `8000`
- `db` - PostgreSQL database on port `5432`

The frontend calls the backend over HTTP. The backend connects to PostgreSQL with SQLAlchemy and uses Alembic migrations for schema changes.

---

## Getting Started

### Requirements

- Docker
- Docker Compose

### Environment

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

Required backend variables:

- `SECRET_KEY` - JWT signing key
- `ADMIN_USERNAME` - administrator login
- `ADMIN_PASSWORD_HASH` - Argon2id hash of the administrator password

The provided `.env.example` allows local admin login with:

- username: `admin`
- password: `admin`

### Start The Application

Run from the project root:

```bash
docker compose up --build
```

Then apply database migrations:

```bash
docker compose exec backend alembic upgrade head
```

Seed demo data:

```bash
docker compose exec backend python seed.py
```

The seed is deterministic and idempotent. Running it again updates the seeded records instead of creating another copy.

---

## Seed Data

`backend/seed.py` creates a demo dataset:

- 12 rental locations in the GZM metropolitan area
- 50 cars
- 100 customer accounts
- 5 discount codes
- 150 paid rentals with invoices

The seeded rentals include historical completed rentals, currently active paid rentals and future paid reservations. Seeded customer accounts use the password:

```text
Password123!
```

If you want a completely clean seeded database, remove the PostgreSQL volume first:

```bash
docker compose down -v
docker compose up --build
docker compose exec backend alembic upgrade head
docker compose exec backend python seed.py
```

---

## Application URLs

- Frontend: http://localhost:5173
- API root: http://localhost:8000
- Swagger UI: http://localhost:8000/docs

Main frontend routes:

- `/` - home page
- `/login` - login
- `/register` - customer registration
- `/cars` - customer car browsing and rental flow
- `/user/:userId` - customer profile
- `/user/:userId/history` - rental history and invoice downloads
- `/admin` - admin panel

---

## API Overview

Authentication uses JWT Bearer tokens.

Public endpoints:

- `POST /login`
- `POST /signup`

Shared authenticated endpoint:

- `GET /lookups`

Customer endpoints:

- `GET /cars`
- `POST /rent`
- `POST /rent/payment`
- `GET /user/{user_id}`
- `PATCH /user/{user_id}`
- `DELETE /user/{user_id}`
- `GET /user/{user_id}/history`
- `GET /user/{user_id}/history/{rental_id}/invoice`

Admin endpoints:

- `GET /admin/cars`
- `GET /admin/cars/{car_id}`
- `POST /admin/cars`
- `PATCH /admin/cars/{car_id}`
- `DELETE /admin/cars/{car_id}`
- `GET /admin/customers`
- `GET /admin/customers/{customer_id}`
- `DELETE /admin/customers/{customer_id}`
- `GET /admin/discounts`
- `GET /admin/discounts/{discount_id}`
- `POST /admin/discounts`
- `PATCH /admin/discounts/{discount_id}`
- `DELETE /admin/discounts/{discount_id}`
- `GET /admin/rentals`
- `GET /admin/rentals/{rental_id}`
- `GET /admin/rentals/{rental_id}/invoice`
- `GET /admin/lookups`

---

## Database

Docker Compose starts PostgreSQL with these local development settings:

- host: `localhost`
- internal Docker host: `db`
- port: `5432`
- database: `car_rental`
- user: `postgres`
- password: `postgres`

The backend container receives:

```text
DATABASE_URL=postgresql+psycopg://postgres:postgres@db:5432/car_rental
```
