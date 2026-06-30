import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { PageShell, PageSection } from "../../components/PageShell.jsx";
import { apiFetch, readJsonResponse } from "../../lib/api.js";
import { featuredCars } from "../../lib/demoData.js";

const STEPS = [
  { key: "car", label: "Car & dates" },
  { key: "driver", label: "Driver details" },
  { key: "checkout", label: "Checkout" },
];

function diffDays(pickup, ret) {
  if (!pickup || !ret) return 0;
  const start = new Date(pickup);
  const end = new Date(ret);
  const ms = end - start;
  if (Number.isNaN(ms) || ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default function UserRentPaymentPage({ session, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Car arrives via navigation state from the car card ("Rent this car").
  // Falls back to the first demo car so the page never renders empty if
  // someone lands here directly.
  const preselectedCar = location.state?.car;
  const initialCarId = preselectedCar?.id || preselectedCar?.car_id || featuredCars[0].id;

  const [stepIndex, setStepIndex] = useState(0);
  const [carId, setCarId] = useState(initialCarId);
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [extras, setExtras] = useState({
    insurance: false,
    childSeat: false,
    gps: false,
  });

  const [driver, setDriver] = useState({
    first_name: session?.payload?.first_name || "",
    last_name: session?.payload?.last_name || "",
    email: session?.email || "",
    phone: "",
    driver_license_no: "",
  });

  const [couponCode, setCouponCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Card");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  const selectedCar = useMemo(
    () => featuredCars.find((car) => car.id === carId) || featuredCars[0],
    [carId]
  );

  const rentalDays = diffDays(pickupDate, returnDate);

  const extrasCost = useMemo(() => {
    let total = 0;
    if (extras.insurance) total += 25;
    if (extras.childSeat) total += 10;
    if (extras.gps) total += 8;
    return total;
  }, [extras]);

  const subtotal = rentalDays * selectedCar.rate;
  const extrasTotal = rentalDays * extrasCost;
  const estimatedTotal = subtotal + extrasTotal;

  function updateExtra(key, value) {
    setExtras((previous) => ({ ...previous, [key]: value }));
  }

  function updateDriverField(field, value) {
    setDriver((previous) => ({ ...previous, [field]: value }));
  }

  function goToStep(index) {
    setError("");
    setStepIndex(index);
  }

  function handleCarDatesNext(event) {
    event.preventDefault();
    if (!pickupDate || !returnDate) {
      setError("Pick both a pickup and return date.");
      return;
    }
    if (rentalDays <= 0) {
      setError("Return date must be after the pickup date.");
      return;
    }
    goToStep(1);
  }

  function handleDriverNext(event) {
    event.preventDefault();
    if (!driver.first_name || !driver.last_name || !driver.email || !driver.phone || !driver.driver_license_no) {
      setError("Fill in all driver details before continuing.");
      return;
    }
    goToStep(2);
  }

  async function handleConfirmOrder() {
    setLoading(true);
    setError("");

    const orderPayload = {
      car_id: selectedCar.id,
      pickup_date: pickupDate,
      return_date: returnDate,
      pickup_location: pickupLocation || null,
      extras,
      driver,
      coupon_code: couponCode || null,
      payment_method: paymentMethod,
      estimated_total: estimatedTotal,
    };

    try {
      // TODO: fill in the real reservation/checkout endpoint once it's
      // available on the backend (e.g. POST /rentals or /reservations).
      const response = await apiFetch("", {
        token: session?.token,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data?.detail || "Could not confirm the order.");
      }

      setConfirmation(data || orderPayload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not confirm the order.");
    } finally {
      setLoading(false);
    }
  }

  if (confirmation) {
    return (
      <PageShell session={session} onLogout={onLogout}>
        <PageSection
          eyebrow="Customer"
          title="Booking confirmed"
          subtitle="Your reservation has been recorded."
        >
          <section className="auth-layout" style={{ marginLeft: 0 }}>
            <article className="car-card">
              <h2>
                {selectedCar.brand} {selectedCar.model}
              </h2>
              <div className="car-details">
                <p>
                  <span>Pickup</span>
                  <strong>{pickupDate}</strong>
                </p>
                <p>
                  <span>Return</span>
                  <strong>{returnDate}</strong>
                </p>
                <p>
                  <span>Total paid</span>
                  <strong>{estimatedTotal} zł</strong>
                </p>
              </div>
            </article>

            <div className="hero-actions">
              <Link className="primary-link" to="/user/history">
                View rental history
              </Link>
              <Link className="back-link" to="/user" style={{ marginLeft: 12 }}>
                Back to user area
              </Link>
            </div>
          </section>
        </PageSection>
      </PageShell>
    );
  }

  return (
    <PageShell session={session} onLogout={onLogout}>
      <PageSection
        eyebrow="Customer"
        title="Rent a car"
        subtitle="Pick your dates, add your details, then confirm the order."
      >
        <div className="hero-actions" style={{ marginTop: 0 }}>
          <Link className="back-link" to="/user">
            ← Back to user area
          </Link>
        </div>

        {/* Step indicator */}
        <nav className="rent-steps" aria-label="Booking steps">
          {STEPS.map((step, index) => (
            <button
              key={step.key}
              type="button"
              className={`rent-step ${index === stepIndex ? "rent-step-active" : ""} ${index < stepIndex ? "rent-step-done" : ""}`}
              onClick={() => index < stepIndex && goToStep(index)}
              disabled={index > stepIndex}
            >
              <span className="rent-step-index">{index + 1}</span>
              {step.label}
            </button>
          ))}
        </nav>

        <div className="rent-flow-layout">
          {/* ── Step 1: Car & dates ── */}
          {stepIndex === 0 && (
            <form className="auth-form rent-flow-form" onSubmit={handleCarDatesNext}>
              <label>
                Car
                <select value={carId} onChange={(event) => setCarId(event.target.value)}>
                  {featuredCars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.brand} {car.model} — {car.rate} zł/day
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Pickup date
                <input type="date" value={pickupDate} onChange={(event) => setPickupDate(event.target.value)} required />
              </label>

              <label>
                Return date
                <input type="date" value={returnDate} onChange={(event) => setReturnDate(event.target.value)} required />
              </label>

              <label>
                Pickup location
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(event) => setPickupLocation(event.target.value)}
                  placeholder="e.g. Warsaw Airport"
                />
              </label>

              <fieldset className="rent-extras-fieldset">
                <legend>Optional extras</legend>

                <label className="rent-checkbox-row">
                  <input type="checkbox" checked={extras.insurance} onChange={(event) => updateExtra("insurance", event.target.checked)} />
                  Extra insurance — 25 zł/day
                </label>

                <label className="rent-checkbox-row">
                  <input type="checkbox" checked={extras.childSeat} onChange={(event) => updateExtra("childSeat", event.target.checked)} />
                  Child seat — 10 zł/day
                </label>

                <label className="rent-checkbox-row">
                  <input type="checkbox" checked={extras.gps} onChange={(event) => updateExtra("gps", event.target.checked)} />
                  GPS navigation — 8 zł/day
                </label>
              </fieldset>

              {error && <p className="status-text error-text">{error}</p>}

              <button type="submit" className="primary-link auth-submit">
                Continue to driver details
              </button>
            </form>
          )}

          {/* ── Step 2: Driver details ── */}
          {stepIndex === 1 && (
            <form className="auth-form rent-flow-form" onSubmit={handleDriverNext}>
              <label>
                First name
                <input type="text" value={driver.first_name} onChange={(event) => updateDriverField("first_name", event.target.value)} required />
              </label>

              <label>
                Last name
                <input type="text" value={driver.last_name} onChange={(event) => updateDriverField("last_name", event.target.value)} required />
              </label>

              <label>
                Email
                <input type="email" value={driver.email} onChange={(event) => updateDriverField("email", event.target.value)} required />
              </label>

              <label>
                Phone
                <input type="tel" value={driver.phone} onChange={(event) => updateDriverField("phone", event.target.value)} placeholder="+48123123123" required />
              </label>

              <label>
                Driver license number
                <input type="text" value={driver.driver_license_no} onChange={(event) => updateDriverField("driver_license_no", event.target.value)} required />
              </label>

              {error && <p className="status-text error-text">{error}</p>}

              <div className="hero-actions" style={{ marginTop: 0 }}>
                <button type="button" className="back-link" onClick={() => goToStep(0)}>
                  ← Back
                </button>
                <button type="submit" className="primary-link auth-submit" style={{ marginLeft: 12 }}>
                  Continue to checkout
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3: Checkout ── */}
          {stepIndex === 2 && (
            <div className="rent-flow-form">
              <label>
                Coupon code (optional)
                <input type="text" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="e.g. SUMMER10" />
              </label>

              <label>
                Payment method
                <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                  <option>Card</option>
                  <option>Bank transfer</option>
                  <option>Apple Pay</option>
                </select>
              </label>

              {error && <p className="status-text error-text">{error}</p>}

              <div className="hero-actions" style={{ marginTop: 8 }}>
                <button type="button" className="back-link" onClick={() => goToStep(1)}>
                  ← Back
                </button>
                <button
                  type="button"
                  className="primary-link auth-submit"
                  style={{ marginLeft: 12 }}
                  onClick={handleConfirmOrder}
                  disabled={loading}
                >
                  {loading ? "Confirming..." : `Confirm & pay ${estimatedTotal} zł`}
                </button>
              </div>
            </div>
          )}

          {/* ── Order summary sidebar ── */}
          <aside className="rent-summary-card">
            <h2>Order summary</h2>

            <div className="car-details">
              <p>
                <span>Car</span>
                <strong>
                  {selectedCar.brand} {selectedCar.model}
                </strong>
              </p>
              <p>
                <span>Daily rate</span>
                <strong>{selectedCar.rate} zł</strong>
              </p>
              <p>
                <span>Pickup</span>
                <strong>{pickupDate || "—"}</strong>
              </p>
              <p>
                <span>Return</span>
                <strong>{returnDate || "—"}</strong>
              </p>
              <p>
                <span>Days</span>
                <strong>{rentalDays || "—"}</strong>
              </p>
              <p>
                <span>Extras / day</span>
                <strong>{extrasCost} zł</strong>
              </p>
              <p>
                <span>Subtotal</span>
                <strong>{subtotal} zł</strong>
              </p>
              <p>
                <span>Extras total</span>
                <strong>{extrasTotal} zł</strong>
              </p>
              <p>
                <span>Estimated total</span>
                <strong>{estimatedTotal} zł</strong>
              </p>
            </div>
          </aside>
        </div>
      </PageSection>
    </PageShell>
  );
}
