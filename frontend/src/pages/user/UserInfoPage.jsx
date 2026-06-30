import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageShell, PageSection } from "../../components/PageShell.jsx";
import { apiFetch, readJsonResponse } from "../../lib/api.js";

export default function UserInfoPage({ session, onLogout }) {
  const [formData, setFormData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  function updateField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  // 1. LOAD CURRENT USER DATA
  useEffect(() => {
    async function loadProfile() {
      if (!session?.token || !session?.payload?.sub) return;

      try {
        const response = await apiFetch(`/user/${session.payload.sub}`, {
          token: session.token,
        });

        const data = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error(data?.detail || "Failed to load profile");
        }

        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          city: data.city || "",
        });
      } catch (err) {
        console.error(err);
        setMessage("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [session]);

  // 2. SAVE UPDATES TO BACKEND
  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await apiFetch(`/user/${session.payload.sub}`, {
        method: "PATCH",
        token: session.token,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to update profile");
      }

      setFormData({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        city: data.city,
      });

      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Update failed.");
    }
  }

  if (loading || !formData) {
    return (
      <PageShell session={session} onLogout={onLogout}>
        <PageSection eyebrow="Customer" title="Info" subtitle="Loading profile...">
          <p>Loading...</p>
        </PageSection>
      </PageShell>
    );
  }

  return (
    <PageShell session={session} onLogout={onLogout}>
      <PageSection eyebrow="Customer" title="Info" subtitle="Manage your profile details.">
        <div className="hero-actions" style={{ marginTop: 0 }}>
          <Link className="back-link" to="/user">
            ← Back to user area
          </Link>
        </div>

        <section className="auth-layout" style={{ marginLeft: 0 }}>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              First name
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
              />
            </label>

            <label>
              Last name
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </label>

            <label>
              Phone
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </label>

            <label>
              City
              <input
                type="text"
                value={formData.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </label>

            <button type="submit" className="primary-link auth-submit">
              Save changes
            </button>
          </form>

          {message && <p className="status-text">{message}</p>}
        </section>
      </PageSection>
    </PageShell>
  );
}