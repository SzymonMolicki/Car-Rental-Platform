import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import CarModal from "../../components/CarModal.jsx";
import { PageShell, PageSection } from "../../components/PageShell.jsx";
import { apiFetch, readJsonResponse } from "../../lib/api.js";

export default function AdminCarsPage({ session, onLogout }) {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCar, setSelectedCar] = useState(null);

  useEffect(() => {
    async function loadCars() {
      try {
        const response = await apiFetch("/admin/cars", { token: session?.token });
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
      <PageSection eyebrow="Admin" title="Cars" subtitle="Backend-driven admin list of all cars.">
        <div className="hero-actions" style={{ marginTop: 0 }}>
          <Link className="back-link" to="/admin">← Back to dashboard</Link>
        </div>

        {loading && <p className="status-text">Loading cars…</p>}
        {error && <p className="status-text error-text">{error}</p>}
        {!loading && !error && cars.length === 0 && <p className="status-text">No cars found.</p>}

        {cars.length > 0 && (
          <section className="cars-grid">
            {cars.map((car) => (
              <article
                className="car-card car-card-clickable"
                key={car.car_id || car.id}
                onClick={() => setSelectedCar(car)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setSelectedCar(car)}
              >
                <div className="car-card-top">
                  <span className="car-status">{car.car_status?.name || car.car_status_id}</span>
                  <span className="car-year">{car.production_year}</span>
                </div>

                <h2>{car.brand} {car.model}</h2>

                <div className="car-details">
                  <p><span>Daily rate</span><strong>{car.daily_rate} zł</strong></p>
                  <p><span>Plate</span><strong>{car.plate_number}</strong></p>
                  <p><span>Fuel</span><strong>{car.fuel_type?.name || "—"}</strong></p>
                  <p><span>Transmission</span><strong>{car.transmission?.name || "—"}</strong></p>
                </div>

                <div className="car-card-hint">Click for full details</div>
              </article>
            ))}
          </section>
        )}
      </PageSection>

      {selectedCar && (
        <CarModal car={selectedCar} onClose={() => setSelectedCar(null)} />
      )}
    </PageShell>
  );
}
