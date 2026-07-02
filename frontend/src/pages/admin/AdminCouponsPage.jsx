import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import EntityDetailsModal from "../../components/EntityDetailsModal.jsx";
import { PageShell, PageSection } from "../../components/PageShell.jsx";
import { requestJson } from "../../lib/api.js";

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "N/A";
}

export default function AdminCouponsPage({ session, onLogout }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  useEffect(() => {
    async function loadCoupons() {
      try {
        const data = await requestJson("/admin/discounts", {
          token: session?.token,
          fallbackMessage: "Failed to load coupons",
        });
        setCoupons(Array.isArray(data) ? data : []);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not load coupons.");
      } finally {
        setLoading(false);
      }
    }

    loadCoupons();
  }, [session?.token]);

  async function handleDeleteCoupon(coupon) {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;

    try {
      await requestJson(`/admin/discounts/${coupon.discount_id}`, {
        token: session?.token,
        method: "DELETE",
        fallbackMessage: "Failed to delete coupon",
      });

      setCoupons((previous) => previous.filter((item) => item.discount_id !== coupon.discount_id));
      setSelectedCoupon(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not delete coupon.");
    }
  }

  const sortedCoupons = useMemo(
    () => [...coupons].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [coupons],
  );

  return (
    <PageShell session={session} onLogout={onLogout}>
      <PageSection eyebrow="Management" title="Coupons" subtitle="Review active discounts and create new offers.">
        <div className="hero-actions" style={{ marginTop: 0, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="back-link" to="/admin">
            ← Back to dashboard
          </Link>
          <Link className="primary-link" to="/admin/addcoupon">
            + Add new coupon
          </Link>
        </div>

        {loading && <p className="status-text">Loading coupons...</p>}
        {error && <p className="status-text error-text">{error}</p>}
        {!loading && !error && sortedCoupons.length === 0 && <p className="status-text">No coupons found.</p>}

        {sortedCoupons.length > 0 && (
          <section className="cars-grid">
            {sortedCoupons.map((coupon) => (
              <article
                className="car-card car-card-clickable"
                key={coupon.discount_id}
                onClick={() => setSelectedCoupon(coupon)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedCoupon(coupon);
                  }
                }}
              >
                <div className="car-card-top">
                  <span className="car-status">{coupon.is_active ? "Active" : "Inactive"}</span>
                  <span className="car-year">{coupon.percent_value}%</span>
                </div>

                <h2>{coupon.code}</h2>
                <p className="subtitle" style={{ marginTop: 8 }}>{coupon.name}</p>

                <div className="car-details">
                  <p>
                    <span>Valid from</span>
                    <strong>{formatDate(coupon.valid_from)}</strong>
                  </p>
                  <p>
                    <span>Valid to</span>
                    <strong>{formatDate(coupon.valid_to)}</strong>
                  </p>
                  <p>
                    <span>Created</span>
                    <strong>{formatDate(coupon.created_at)}</strong>
                  </p>
                </div>

                <div className="car-card-hint">Click for full details</div>
              </article>
            ))}
          </section>
        )}
      </PageSection>

      {selectedCoupon && (
        <EntityDetailsModal
          title={selectedCoupon.code}
          description={selectedCoupon.name}
          badges={[
            { label: "Status", value: selectedCoupon.is_active ? "Active" : "Inactive" },
            { label: "Discount", value: `${selectedCoupon.percent_value}%` },
          ]}
          details={[
            { label: "Name", value: selectedCoupon.name },
            { label: "Code", value: selectedCoupon.code },
            { label: "Percent value", value: `${selectedCoupon.percent_value}%` },
            { label: "Valid from", value: formatDate(selectedCoupon.valid_from) },
            { label: "Valid to", value: formatDate(selectedCoupon.valid_to) },
            { label: "Created", value: formatDate(selectedCoupon.created_at) },
          ]}
          actions={[
            <button
              key="delete-coupon"
              className="button-pill button-pill-danger"
              type="button"
              onClick={() => handleDeleteCoupon(selectedCoupon)}
            >
              Delete coupon
            </button>,
          ]}
          onClose={() => setSelectedCoupon(null)}
        />
      )}
    </PageShell>
  );
}
