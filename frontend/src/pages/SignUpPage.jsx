import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { PageShell } from "../components/PageShell.jsx";
import { API_URL, readJsonResponse } from "../lib/api.js";

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  confirm_password: "",
  phone: "",
  date_of_birth: "",
  driver_license_no: "",
  license_expiry_date: "",
  street: "",
  city: "",
  postal_code: "",
  country: "",
};

function formatSignupError(detail) {
  if (!detail) return "Registration failed";

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        const location = Array.isArray(item?.loc) ? item.loc.filter(Boolean).join(".") : "";
        const message = item?.msg || item?.message || JSON.stringify(item);
        return location ? `${location}: ${message}` : message;
      })
      .join("; ");
  }

  if (typeof detail === "object") {
    return detail.message || detail.detail || detail.error || JSON.stringify(detail);
  }

  return String(detail);
}

export default function SignUpPage({ session, onLogout }) {
  const navigate = useNavigate();
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
      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          date_of_birth: formData.date_of_birth || null,
          driver_license_no: formData.driver_license_no || null,
          license_expiry_date: formData.license_expiry_date || null,
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(formatSignupError(data?.detail || data));
      }

      setMessage(data?.message || "Account created successfully.");
      setFormData(emptyForm);
      navigate("/login", {
        replace: true,
        state: { email: formData.email, message: "Account created. Please log in." },
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not register.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell session={session} onLogout={onLogout}>
      <section className="auth-layout">
        <h1>Sign up</h1>
        <p className="subtitle">Create a customer account and then continue into the car view.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            First name
            <input type="text" value={formData.first_name} onChange={(event) => updateField("first_name", event.target.value)} required />
          </label>

          <label>
            Last name
            <input type="text" value={formData.last_name} onChange={(event) => updateField("last_name", event.target.value)} required />
          </label>

          <label>
            Email
            <input type="email" value={formData.email} onChange={(event) => updateField("email", event.target.value)} required />
          </label>

          <label>
            Password
            <input type="password" value={formData.password} onChange={(event) => updateField("password", event.target.value)} minLength={8} required />
          </label>

          <label>
            Confirm password
            <input type="password" value={formData.confirm_password} onChange={(event) => updateField("confirm_password", event.target.value)} minLength={8} required />
          </label>

          <label>
            Phone
            <input type="tel" value={formData.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="+48123123123" required />
          </label>

          <label>
            Date of birth
            <input type="date" value={formData.date_of_birth} onChange={(event) => updateField("date_of_birth", event.target.value)} />
          </label>

          <label>
            Driver license number
            <input type="text" value={formData.driver_license_no} onChange={(event) => updateField("driver_license_no", event.target.value)} />
          </label>

          <label>
            License expiry date
            <input type="date" value={formData.license_expiry_date} onChange={(event) => updateField("license_expiry_date", event.target.value)} />
          </label>

          <label>
            Street
            <input type="text" value={formData.street} onChange={(event) => updateField("street", event.target.value)} required />
          </label>

          <label>
            City
            <input type="text" value={formData.city} onChange={(event) => updateField("city", event.target.value)} required />
          </label>

          <label>
            Postal code
            <input type="text" value={formData.postal_code} onChange={(event) => updateField("postal_code", event.target.value)} required />
          </label>

          <label>
            Country
            <input type="text" value={formData.country} onChange={(event) => updateField("country", event.target.value)} required />
          </label>

          <button type="submit" className="primary-link auth-submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {message && <p className="status-text">{message}</p>}
        {error && <p className="status-text error-text">{error}</p>}

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </section>
    </PageShell>
  );
}