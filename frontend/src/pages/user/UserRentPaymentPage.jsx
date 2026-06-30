import { useState } from "react";
import { Link } from "react-router-dom";

import { PageShell, PageSection } from "../../components/PageShell.jsx";
import { featuredCars, samplePayments } from "../../lib/demoData.js";

export default function UserRentPaymentPage({ session, onLogout }) {
  const [formData, setFormData] = useState({
    car_id: featuredCars[0].id,
    pickup_date: "",
    return_date: "",
    payment_method: "Card",
  });
  const [message, setMessage] = useState("");

  function updateField(field, value) {
    setFormData((previous) => ({ ...previous, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setMessage(`Payment flow saved for ${formData.car_id}. Basic frontend only.`);
  }

  return (
    <PageShell session={session} onLogout={onLogout}>
      <PageSection eyebrow="Customer" title="Rent payment" subtitle="Choose a car and complete a simple booking form.">
        <div className="hero-actions" style={{ marginTop: 0 }}>
          <Link className="back-link" to="/user">
            ← Back to user area
          </Link>
        </div>

        <section className="auth-layout" style={{ marginLeft: 0 }}>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Car
              <select value={formData.car_id} onChange={(event) => updateField("car_id", event.target.value)}>
                {featuredCars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.brand} {car.model} — {car.rate} zł/day
                  </option>
                ))}
              </select>
            </label>

            <label>
              Pickup date
              <input type="date" value={formData.pickup_date} onChange={(event) => updateField("pickup_date", event.target.value)} required />
            </label>

            <label>
              Return date
              <input type="date" value={formData.return_date} onChange={(event) => updateField("return_date", event.target.value)} required />
            </label>

            <label>
              Payment method
              <select value={formData.payment_method} onChange={(event) => updateField("payment_method", event.target.value)}>
                <option>Card</option>
                <option>Bank transfer</option>
                <option>Apple Pay</option>
              </select>
            </label>

            <button type="submit" className="primary-link auth-submit">
              Confirm payment
            </button>
          </form>

          {message && <p className="status-text">{message}</p>}

          <section className="cars-grid" style={{ marginTop: 24 }}>
            {samplePayments.map((payment) => (
              <article className="car-card" key={payment.id}>
                <h2>{payment.id}</h2>
                <div className="car-details">
                  <p>
                    <span>Date</span>
                    <strong>{payment.date}</strong>
                  </p>
                  <p>
                    <span>Amount</span>
                    <strong>{payment.amount}</strong>
                  </p>
                  <p>
                    <span>Method</span>
                    <strong>{payment.method}</strong>
                  </p>
                </div>
              </article>
            ))}
          </section>
        </section>
      </PageSection>
    </PageShell>
  );
}