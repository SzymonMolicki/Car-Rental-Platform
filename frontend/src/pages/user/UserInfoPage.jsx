import { useState } from "react";
import { Link } from "react-router-dom";

import { PageShell, PageSection } from "../../components/PageShell.jsx";

export default function UserInfoPage({ session, onLogout }) {
  const [formData, setFormData] = useState({
    first_name: session?.payload?.first_name || "Alex",
    last_name: session?.payload?.last_name || "Morgan",
    email: session?.email || "customer@example.com",
    phone: "+48123123123",
    city: "Warsaw",
  });
  const [message, setMessage] = useState("");

  function updateField(field, value) {
    setFormData((previous) => ({ ...previous, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("Profile saved locally. Backend integration can be connected later.");
  }

  return (
    <PageShell session={session} onLogout={onLogout}>
      <PageSection eyebrow="Customer" title="Info" subtitle="Basic editable profile screen.">
        <div className="hero-actions" style={{ marginTop: 0 }}>
          <Link className="back-link" to="/user">
            ← Back to user area
          </Link>
        </div>

        <section className="auth-layout" style={{ marginLeft: 0 }}>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              First name
              <input type="text" value={formData.first_name} onChange={(event) => updateField("first_name", event.target.value)} />
            </label>

            <label>
              Last name
              <input type="text" value={formData.last_name} onChange={(event) => updateField("last_name", event.target.value)} />
            </label>

            <label>
              Email
              <input type="email" value={formData.email} onChange={(event) => updateField("email", event.target.value)} />
            </label>

            <label>
              Phone
              <input type="tel" value={formData.phone} onChange={(event) => updateField("phone", event.target.value)} />
            </label>

            <label>
              City
              <input type="text" value={formData.city} onChange={(event) => updateField("city", event.target.value)} />
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