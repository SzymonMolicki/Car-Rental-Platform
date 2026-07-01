import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import CarModal from "../components/CarModal.jsx";
import { PageShell, PageSection } from "../components/PageShell.jsx";
import { apiFetch, readJsonResponse } from "../lib/api.js";

export default function CarsPage({ session, onLogout }) {
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCars() {
      try {
        const response = await apiFetch("/cars", { token: session?.token });
        const data = await readJsonResponse(response);

        if (!response.ok) throw new Error(data?.detail || "Failed to load cars");

        setCars(Array.isArray(data) ? data : []);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not load cars.");
      } finally {
        setLoading(false);
      }
    }

    loadCars();
  }, [session?.token]);

  return (
    <PageShell session={session} onLogout={onLogout}>
      <PageSection
        eyebrow="Customer view"
        title="Available cars"
        subtitle="Basic car browsing page for logged-in users."
        actions={<Link className="primary-link" to="/user/rent/payment">Book a car</Link>}
      >
        {loading && <p className="status-text">Loading available cars…</p>}
        {error && <p className="status-text error-text">{error}</p>}
        {!loading && !error && cars.length === 0 && <p className="status-text">No cars found.</p>}

        <section className="cars-grid">
          {cars.map((car) => (
            <article
              className="car-card car-card-clickable"
              key={car.car_id}
              onClick={() => setSelectedCar(car)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedCar(car)}
            >
              <div className="car-card-top">
                <span className="car-status">{car.car_status?.name || "Available"}</span>
                <span className="car-year">{car.production_year}</span>
              </div>

              <h2>
                {car.brand} {car.model}
              </h2>

              <div className="car-details">
                <p>
                  <span>Plate</span>
                  <strong>{car.plate_number}</strong>
                </p>

                <p>
                  <span>Fuel</span>
                  <strong>{car.fuel_type?.name || "—"}</strong>
                </p>

                <p>
                  <span>Transmission</span>
                  <strong>{car.transmission?.name || "—"}</strong>
                </p>

                <p>
                  <span>Color</span>
                  <strong>{car.color || "—"}</strong>
                </p>

                <p>
                  <span>Daily rate</span>
                  <strong>{car.daily_rate} zł</strong>
                </p>
              </div>

              <div className="hero-actions" style={{ marginTop: 14 }}>
                <Link
                  className="back-link"
                  to="/user/rent/payment"
                  state={{ car }}
                  onClick={(event) => event.stopPropagation()}
                >
                  Rent this car
                </Link>
              </div>

              <div className="car-card-hint">Click for full details</div>
            </article>
          ))}
        </section>
      </PageSection>

      {selectedCar && (
        <CarModal car={selectedCar} onClose={() => setSelectedCar(null)} />
      )}
    </PageShell>
  );
}
