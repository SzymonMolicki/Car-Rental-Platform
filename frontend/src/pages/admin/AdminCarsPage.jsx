import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageShell, PageSection } from "../../components/PageShell.jsx";
import { apiFetch, readJsonResponse } from "../../lib/api.js";

export default function AdminCarsPage({ session, onLogout }) {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCars() {
      try {
        const response = await apiFetch("/admin/cars", { token: session?.token });
        const data = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error(data?.detail || "Failed to load cars");
        }

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
          <Link className="back-link" to="/admin">
            ← Back to dashboard
          </Link>
        </div>

        {loading && <p className="status-text">Loading cars...</p>}
        {error && <p className="status-text error-text">{error}</p>}

        {!loading && !error && cars.length === 0 && <p className="status-text">No cars found.</p>}

        {cars.length > 0 && (
          <section className="cars-grid">
            {cars.map((car) => (
              <article className="car-card" key={car.car_id || car.id}>
                <div className="car-card-top">
                  <span className="car-status">{car.production_year}</span>
                  <span className="car-year">{car.daily_rate} zł</span>
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
                    <span>Status id</span>
                    <strong>{car.car_status_id}</strong>
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}
      </PageSection>
    </PageShell>
  );
}