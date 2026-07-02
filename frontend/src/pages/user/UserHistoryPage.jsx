import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { PageShell, PageSection } from "../../components/PageShell.jsx";
import { downloadBlob, requestJson, saveBlob } from "../../lib/api.js";
import { getSessionUserId } from "../../lib/auth.js";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pl-PL");
}

function formatFileDate(value) {
  if (!value) return "date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "date";

  return date.toISOString().slice(0, 10);
}

function formatFilePart(value, fallback = "rental") {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

export default function UserHistoryPage({ session, onLogout }) {
  const { userId: routeUserId } = useParams();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = routeUserId ?? getSessionUserId(session);

  useEffect(() => {
    if (!userId) {
      setError("Missing user id.");
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const data = await requestJson(`/user/${userId}/history`, {
          token: session?.token,
          fallbackMessage: "Failed to load history",
        });

        setRentals(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load rental history.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId, session?.token]);

  async function downloadInvoice(item) {
    try {
      const rentalId = item.rental_id;
      const blob = await downloadBlob(`/user/${userId}/history/${rentalId}/invoice`, {
        token: session?.token,
        fallbackMessage: "Failed to download invoice",
      });
      saveBlob(blob, `invoice-${formatFilePart(item.car)}-${formatFileDate(item.start_date)}.pdf`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not download invoice.");
    }
  }

  return (
    <PageShell session={session} onLogout={onLogout}>
      <PageSection eyebrow="Your rentals" title="History" subtitle="Check rental dates, statuses, and available invoices.">
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
                    <button className="back-link" type="button" onClick={() => downloadInvoice(item)}>
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
