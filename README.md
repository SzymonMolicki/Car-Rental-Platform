# Car Rental Platform

This project is a system for managing a car rental company.

The final application will provide a REST API and a web interface that allow customers to browse available cars, create reservations, manage rentals and make payments. On the administrative side, it will support fleet management, customer management and rental processing.

The system is built with FastAPI, PostgreSQL and SQLAlchemy, uses Alembic for database migrations and React for frontend.

---

## Technologies

- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- React
- Docker Compose

---

## Architecture

The application consists of three services:

- frontend (React, port 5173)
- backend (FastAPI, port 8000)
- database (PostgreSQL, port 5432)

The frontend communicates with the backend via HTTP API.
The backend communicates with the database using SQLAlchemy.

---

## Running the application

### Requirements

- Docker
- Docker Compose

### Start the system

In the root directory of the project run:

```bash
docker compose up --build
```

This command will:
- start the PostgreSQL database,
- build and start the backend container (FastAPI),
- build and start the frontend container (React).

---

## Accessing the application

After the containers are running, open a browser and go to:

**Frontend (React):**
http://localhost:5173

**Cars page:**
http://localhost:5173/cars

**API documentation (Swagger UI):**
http://localhost:8000/docs

---

## Example usage

### Create a car

Use the Swagger UI (`/docs`) and call:

POST /cars

Example request body:

```json
{
  "brand": "Toyota",
  "model": "Corolla",
  "production_year": 2022,
  "daily_rate": 60,
  "status": "available"
}
```

You can also view cars in the frontend at:
http://localhost:5173/cars

---

### Get all cars

GET /cars

Returns all cars stored in the database.

---

## Database

The application uses PostgreSQL running in a Docker container.

Internal connection settings:

- host: db
- port: 5432
- database: car_rental
- user: postgres
- password: postgres

---

## Notes

- The backend and frontend run with automatic reload enabled.
- The frontend communicates with the backend via HTTP (port 8000).
- CORS is configured to allow requests from the frontend.

---

## License

This project is created for educational purposes.
