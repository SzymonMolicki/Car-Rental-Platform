import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import EntityDetailsModal from "../../components/EntityDetailsModal.jsx";
import { PageShell, PageSection } from "../../components/PageShell.jsx";
import { apiFetch, readJsonResponse } from "../../lib/api.js";

function formatValue(value) {
  return value ? new Date(value).toLocaleString() : "N/A";
}

export default function AdminReservationsPage({ session, onLogout }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReservation, setSelectedReservation] = useState(null);

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

  async function downloadInvoice(reservation) {
    try {
      const response = await apiFetch(`/admin/rentals/${reservation.rental_id}/invoice`, { token: session?.token });

      if (!response.ok) {
        const data = await readJsonResponse(response);
        throw new Error(data?.detail || "Failed to download invoice");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `invoice-${reservation.rental_id.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not download invoice.");
    }
  }

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
              <article
                className="car-card car-card-clickable"
                key={reservation.rental_id}
                onClick={() => setSelectedReservation(reservation)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedReservation(reservation);
                  }
                }}
              >
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

                <div className="car-card-hint">Click for full details</div>
              </article>
            ))}
          </section>
        )}
      </PageSection>

      {selectedReservation && (
        <EntityDetailsModal
          title={`Reservation ${selectedReservation.rental_id.slice(0, 8)}`}
          description="Rental record details"
          badges={[{ label: "Status", value: selectedReservation.rental_status_id }]}
          details={[
            { label: "Rental ID", value: selectedReservation.rental_id, monospace: true },
            { label: "Customer ID", value: selectedReservation.customer_id, monospace: true },
            { label: "Car ID", value: selectedReservation.car_id, monospace: true },
            { label: "Pickup location ID", value: selectedReservation.pickup_location_id, monospace: true },
            { label: "Return location ID", value: selectedReservation.return_location_id, monospace: true },
            { label: "Rental status ID", value: selectedReservation.rental_status_id, monospace: true },
            { label: "Start date", value: formatValue(selectedReservation.start_date) },
            { label: "Planned end", value: formatValue(selectedReservation.planned_end_date) },
            { label: "Actual end", value: formatValue(selectedReservation.actual_end_date) },
            { label: "Created", value: formatValue(selectedReservation.created_at) },
          ]}
          actions={[
            <button
              key="download-invoice"
              className="button-pill"
              type="button"
              onClick={() => downloadInvoice(selectedReservation)}
            >
              Get invoice
            </button>,
          ]}
          onClose={() => setSelectedReservation(null)}
        />
      )}
    </PageShell>
  );
}