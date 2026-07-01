import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageShell, PageSection } from "../../components/PageShell.jsx";
import { apiFetch, readJsonResponse } from "../../lib/api.js";

export default function UserInfoPage({ session, onLogout }) {
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const userId = session?.payload?.sub ?? session?.sub;

  useEffect(() => {
    if (!userId) return;

    async function load() {
      try {
        const response = await apiFetch(`/user/${userId}`, { token: session?.token });
        const data = await readJsonResponse(response);

        if (!response.ok) throw new Error(data?.detail || "Failed to load profile");

        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          date_of_birth: data.date_of_birth || "",
          driver_license_no: data.driver_license_no || "",
          license_expiry_date: data.license_expiry_date || "",
          street: data.street || "",
          city: data.city || "",
          postal_code: data.postal_code || "",
          country: data.country || "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load profile.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId, session?.token]);

  function updateField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await apiFetch(`/user/${userId}`, {
        token: session?.token,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) throw new Error(data?.detail || "Failed to save profile");

      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell session={session} onLogout={onLogout}>
      <PageSection eyebrow="Customer" title="Info" subtitle="View and edit your profile details.">
        <div className="hero-actions" style={{ marginTop: 0 }}>
          <Link className="back-link" to="/user">← Back to user area</Link>
        </div>

        {loading && <p className="status-text">Loading profile…</p>}
        {error && !formData && <p className="status-text error-text">{error}</p>}

        {formData && (
          <section className="auth-layout" style={{ marginLeft: 0 }}>
            <form className="auth-form" onSubmit={handleSubmit}>
              <label>First name
                <input type="text" value={formData.first_name} onChange={(e) => updateField("first_name", e.target.value)} />
              </label>
              <label>Last name
                <input type="text" value={formData.last_name} onChange={(e) => updateField("last_name", e.target.value)} />
              </label>
              <label>Email
                <input type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} />
              </label>
              <label>Phone
                <input type="tel" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} />
              </label>
              <label>Date of birth
                <input type="date" value={formData.date_of_birth} onChange={(e) => updateField("date_of_birth", e.target.value)} />
              </label>
              <label>Driver license number
                <input type="text" value={formData.driver_license_no} onChange={(e) => updateField("driver_license_no", e.target.value)} />
              </label>
              <label>License expiry date
                <input type="date" value={formData.license_expiry_date} onChange={(e) => updateField("license_expiry_date", e.target.value)} />
              </label>
              <label>Street
                <input type="text" value={formData.street} onChange={(e) => updateField("street", e.target.value)} />
              </label>
              <label>City
                <input type="text" value={formData.city} onChange={(e) => updateField("city", e.target.value)} />
              </label>
              <label>Postal code
                <input type="text" value={formData.postal_code} onChange={(e) => updateField("postal_code", e.target.value)} />
              </label>
              <label>Country
                <input type="text" value={formData.country} onChange={(e) => updateField("country", e.target.value)} />
              </label>

              <button type="submit" className="primary-link auth-submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </form>

            {message && <p className="status-text">{message}</p>}
            {error && formData && <p className="status-text error-text">{error}</p>}
          </section>
        )}
      </PageSection>
    </PageShell>
  );
}
