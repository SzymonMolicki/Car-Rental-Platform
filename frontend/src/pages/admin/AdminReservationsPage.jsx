import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageShell, PageSection } from "../../components/PageShell.jsx";
import { apiFetch, readJsonResponse } from "../../lib/api.js";

function formatValue(value) {
  return value ? new Date(value).toLocaleString() : "N/A";
}

export default function AdminReservationsPage({ session, onLogout }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReservations() {
      try {
        const response = await apiFetch("/admin/rentals", { token: session?.token });
        const data = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error(data?.detail || "Failed to load reservations");
        }

        setReservations(Array.isArray(data) ? data : []);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not load reservations.");
      } finally {
        setLoading(false);
      }
    }

    loadReservations();
  }, [session?.token]);

  return (
    <PageShell session={session} onLogout={onLogout}>
      <PageSection eyebrow="Admin" title="Reservations" subtitle="All backend rental records.">
        <div className="hero-actions" style={{ marginTop: 0 }}>
          <Link className="back-link" to="/admin">
            ← Back to dashboard
          </Link>
        </div>

        {loading && <p className="status-text">Loading reservations...</p>}
        {error && <p className="status-text error-text">{error}</p>}
        {!loading && !error && reservations.length === 0 && <p className="status-text">No reservations found.</p>}

        {reservations.length > 0 && (
          <section className="cars-grid">
            {reservations.map((reservation) => (
              <article className="car-card" key={reservation.rental_id}>
                <div className="car-card-top">
                  <span className="car-status">{reservation.rental_status_id}</span>
                  <span className="car-year">{reservation.rental_id.slice(0, 8)}</span>
                </div>

                <h2>Reservation</h2>

                <div className="car-details">
                  <p>
                    <span>Start</span>
                    <strong>{formatValue(reservation.start_date)}</strong>
                  </p>
                  <p>
                    <span>Planned end</span>
                    <strong>{formatValue(reservation.planned_end_date)}</strong>
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