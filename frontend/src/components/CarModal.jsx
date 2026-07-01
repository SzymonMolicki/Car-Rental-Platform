import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function CarModal({ car, onClose, actions = [], showRentAction = true }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!car) return null;

  // Some backend fields can come back as nested objects (e.g. {name: "Black"})
  // instead of plain strings/numbers. This safely unwraps those so React never
  // tries to render a raw object as a child.
  function asDisplayValue(value) {
    if (value == null) return value;
    if (typeof value === "object") {
      return value.name ?? value.label ?? value.value ?? value.title ?? null;
    }
    return value;
  }

  // Support both customer (featuredCars) and admin (backend) car shapes
  const brand = asDisplayValue(car.brand);
  const model = asDisplayValue(car.model);
  const year = asDisplayValue(car.year ?? car.production_year);
  const rate = asDisplayValue(car.rate ?? car.daily_rate);
  const status = asDisplayValue(car.status ?? car.car_status_id);
  const id = asDisplayValue(car.id ?? car.car_id);
  const plate = asDisplayValue(car.plate_number);
  const color = asDisplayValue(car.color);
  const fuel = asDisplayValue(car.fuel_type);
  const seats = asDisplayValue(car.seats);
  const transmission = asDisplayValue(car.transmission);
  const mileage = typeof car.mileage === "object" ? null : car.mileage;
  const description = asDisplayValue(car.description);

  return (
    <div className="car-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="car-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="car-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="car-modal-header">
          <div className="car-modal-badges">
            {status && <span className="car-status">{status}</span>}
            {year && <span className="car-year">{year}</span>}
          </div>
          <h2 className="car-modal-title">
            {brand} {model}
          </h2>
          {description && <p className="car-modal-description">{description}</p>}
        </div>

        <div className="car-modal-body">
          <div className="car-modal-details">
            {rate != null && (
              <div className="car-modal-detail-item">
                <span className="car-modal-detail-label">Daily rate</span>
                <strong className="car-modal-detail-value">{rate} zł</strong>
              </div>
            )}
            {id && (
              <div className="car-modal-detail-item">
                <span className="car-modal-detail-label">Car ID</span>
                <strong className="car-modal-detail-value car-modal-id">{id}</strong>
              </div>
            )}
            {plate && (
              <div className="car-modal-detail-item">
                <span className="car-modal-detail-label">Plate number</span>
                <strong className="car-modal-detail-value">{plate}</strong>
              </div>
            )}
            {color && (
              <div className="car-modal-detail-item">
                <span className="car-modal-detail-label">Color</span>
                <strong className="car-modal-detail-value">{color}</strong>
              </div>
            )}
            {fuel && (
              <div className="car-modal-detail-item">
                <span className="car-modal-detail-label">Fuel type</span>
                <strong className="car-modal-detail-value">{fuel}</strong>
              </div>
            )}
            {seats && (
              <div className="car-modal-detail-item">
                <span className="car-modal-detail-label">Seats</span>
                <strong className="car-modal-detail-value">{seats}</strong>
              </div>
            )}
            {transmission && (
              <div className="car-modal-detail-item">
                <span className="car-modal-detail-label">Transmission</span>
                <strong className="car-modal-detail-value">{transmission}</strong>
              </div>
            )}
            {mileage != null && (
              <div className="car-modal-detail-item">
                <span className="car-modal-detail-label">Mileage</span>
                <strong className="car-modal-detail-value">{mileage.toLocaleString()} km</strong>
              </div>
            )}
          </div>
        </div>

        <div className="car-modal-footer">
          {showRentAction && (
            <Link className="primary-link" to="/user/rent/payment" state={{ car }}>
              Rent this car
            </Link>
          )}
          {actions}
          <button className="back-link car-modal-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
