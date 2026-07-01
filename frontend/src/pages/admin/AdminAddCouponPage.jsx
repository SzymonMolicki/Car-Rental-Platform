import { useState } from "react";
import { Link } from "react-router-dom";

import { PageShell, PageSection } from "../../components/PageShell.jsx";
import { apiFetch, readJsonResponse } from "../../lib/api.js";

const emptyForm = {
  name: "",
  code: "",
  percent_value: "",
  valid_from: "",
  valid_to: "",
  is_active: true,
};

export default function AdminAddCouponPage({ session, onLogout }) {
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateField(field, value) {
    setFormData((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await apiFetch("/admin/discounts", {
        token: session?.token,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          percent_value: Number(formData.percent_value),
          valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
          valid_to: formData.valid_to ? new Date(formData.valid_to).toISOString() : null,
          is_active: formData.is_active,
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to create coupon");
      }

      setMessage(`Coupon ${data?.code || formData.code} created.`);
      setFormData(emptyForm);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create coupon.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell session={session} onLogout={onLogout}>
      <PageSection eyebrow="Admin" title="Add coupon" subtitle="Create a discount code using the backend endpoint.">
        <div className="hero-actions" style={{ marginTop: 0 }}>
          <Link className="back-link" to="/admin/coupons">
            ← Back to coupons
          </Link>
        </div>

        <section className="auth-layout" style={{ marginLeft: 0 }}>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Name
              <input type="text" value={formData.name} onChange={(event) => updateField("name", event.target.value)} required />
            </label>

            <label>
              Code
              <input type="text" value={formData.code} onChange={(event) => updateField("code", event.target.value)} required />
            </label>

            <label>
              Percent value
              <input type="number" min="0" step="0.01" value={formData.percent_value} onChange={(event) => updateField("percent_value", event.target.value)} required />
            </label>

            <label>
              Valid from
              <input type="datetime-local" value={formData.valid_from} onChange={(event) => updateField("valid_from", event.target.value)} />
            </label>

            <label>
              Valid to
              <input type="datetime-local" value={formData.valid_to} onChange={(event) => updateField("valid_to", event.target.value)} />
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input type="checkbox" checked={formData.is_active} onChange={(event) => updateField("is_active", event.target.checked)} />
              Active
            </label>

            <button type="submit" className="primary-link auth-submit" disabled={loading}>
              {loading ? "Creating..." : "Create coupon"}
            </button>
          </form>

          {message && <p className="status-text">{message}</p>}
          {error && <p className="status-text error-text">{error}</p>}
        </section>
      </PageSection>
    </PageShell>
  );
}