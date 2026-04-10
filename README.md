# Car Rental Platform

This project is a system for managing a car rental company.

The final application will provide a REST API and a web interface that allow customers to browse available cars, create reservations, manage rentals and make payments. On the administrative side, it will support fleet management, customer management and rental processing.

The system is built with FastAPI, PostgreSQL and SQLAlchemy, uses Alembic for database migrations and is designed to be extended with a React-based frontend.

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
- build the backend container,
- start the FastAPI server.

---

## Accessing the application

After the containers are running, open a browser and go to:

**API documentation (Swagger UI):**
http://localhost:8000/docs

**Basic endpoint:**
http://localhost:8000/

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

- The backend runs with automatic reload enabled.
- Database data is stored in a Docker volume.
- Tables are created automatically on application startup.

---

## License

This project is created for educational purposes.
