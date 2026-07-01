import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageShell, PageSection } from "../../components/PageShell.jsx";
import { apiFetch, readJsonResponse } from "../../lib/api.js";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pl-PL");
}

export default function UserHistoryPage({ session, onLogout }) {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = session?.payload?.sub ?? session?.sub;

  useEffect(() => {
    if (!userId) return;

    async function load() {
      try {
        const response = await apiFetch(`/user/${userId}/history`, { token: session?.token });
        const data = await readJsonResponse(response);

        if (!response.ok) throw new Error(data?.detail || "Failed to load history");

        setRentals(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load rental history.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId, session?.token]);

  async function downloadInvoice(rentalId) {
    try {
      const response = await apiFetch(`/user/${userId}/history/${rentalId}/invoice`, { token: session?.token });

      if (!response.ok) {
        const data = await readJsonResponse(response);
        throw new Error(data?.detail || "Failed to download invoice");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `invoice-${rentalId.slice(0, 8)}.pdf`;
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
      <PageSection eyebrow="Customer" title="History" subtitle="Your past and upcoming rentals.">
        <div className="hero-actions" style={{ marginTop: 0 }}>
          <Link className="back-link" to="/user">← Back to user area</Link>
        </div>

        {loading && <p className="status-text">Loading history…</p>}
        {error && <p className="status-text error-text">{error}</p>}
        {!loading && !error && rentals.length === 0 && (
          <p className="status-text">No rentals yet.</p>
        )}

        {rentals.length > 0 && (
          <section className="cars-grid">
            {rentals.map((item) => (
              <article className="car-card" key={item.rental_id}>
                <div className="car-card-top">
                  <span className="car-status">{item.status}</span>
                  <span className="car-year">{item.has_invoice ? "Invoiced" : "No invoice"}</span>
                </div>

                <h2>{item.car}</h2>

                <div className="car-details">
                  <p><span>Plate</span><strong>{item.plate_number}</strong></p>
                  <p><span>Pickup</span><strong>{item.pickup_location}</strong></p>
                  <p><span>Return</span><strong>{item.return_location}</strong></p>
                  <p><span>Start</span><strong>{formatDate(item.start_date)}</strong></p>
                  <p><span>Planned end</span><strong>{formatDate(item.planned_end_date)}</strong></p>
                  {item.actual_end_date && (
                    <p><span>Actual end</span><strong>{formatDate(item.actual_end_date)}</strong></p>
                  )}
                </div>

                {item.has_invoice && (
                  <div className="hero-actions">
                    <button className="back-link" type="button" onClick={() => downloadInvoice(item.rental_id)}>
                      Download invoice
                    </button>
                  </div>
                )}
              </article>
            ))}
          </section>
        )}
      </PageSection>
    </PageShell>
  );
}
