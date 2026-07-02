import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { PageShell, PageSection } from "../../components/PageShell.jsx";
import { requestJson } from "../../lib/api.js";
import { getUserPath } from "../../lib/auth.js";

const STEPS = [
  { key: "car", label: "Car & dates" },
  { key: "checkout", label: "Checkout" },
];

function diffDays(pickup, ret) {
  if (!pickup || !ret) return 0;
  const ms = new Date(ret) - new Date(pickup);
  if (Number.isNaN(ms) || ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function UserRentPaymentPage({ session, onLogout }) {
  const routeLocation = useLocation();
  const userAreaPath = "/user";
  const userHistoryPath = getUserPath(session, "/history");

  const [cars, setCars] = useState([]);
  const [lookups, setLookups] = useState(null);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [loadingCars, setLoadingCars] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [carLoadError, setCarLoadError] = useState("");

  const preselectedCar = routeLocation.state?.car;
  const preselectedCarId = preselectedCar?.car_id || preselectedCar?.id || "";
  const [carId, setCarId] = useState(preselectedCarId);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pickupLocationId, setPickupLocationId] = useState("");
  const [returnLocationId, setReturnLocationId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");

  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingRentalId, setPendingRentalId] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const rentalDays = diffDays(startDate, endDate);
  const hasValidDateRange = Boolean(startDate && endDate && rentalDays > 0);

  useEffect(() => {
    async function loadLookups() {
      setLoadingLookups(true);
      setLoadError("");
      try {
        const lookupsData = await requestJson("/lookups", {
          token: session?.token,
          fallbackMessage: "Failed to load lookups",
        });
        setLookups(lookupsData);

        if (lookupsData?.payment_methods?.length > 0) {
          setPaymentMethodId((previous) => previous || String(lookupsData.payment_methods[0].id));
        }

        if (lookupsData?.locations?.length > 0) {
          setPickupLocationId((previous) => previous || String(lookupsData.locations[0].id));
          setReturnLocationId((previous) => previous || String(lookupsData.locations[0].id));
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load page data.");
      } finally {
        setLoadingLookups(false);
      }
    }

    loadLookups();
  }, [session?.token]);

  useEffect(() => {
    let ignore = false;

    async function loadCars() {
      setLoadingCars(true);
      setCarLoadError("");

      try {
        const query = hasValidDateRange
          ? `?start_date=${encodeURIComponent(startDate)}&planned_end_date=${encodeURIComponent(endDate)}`
          : "";
        const carsData = await requestJson(`/cars${query}`, {
          token: session?.token,
          fallbackMessage: "Failed to load cars",
        });
        const carList = Array.isArray(carsData) ? carsData : [];

        if (ignore) return;

        setCars(carList);
        setCarId((previous) => {
          if (carList.some((car) => String(car.car_id) === String(previous))) return previous;
          if (!hasValidDateRange && carList.some((car) => String(car.car_id) === String(preselectedCarId))) return preselectedCarId;
          return carList[0]?.car_id || "";
        });
      } catch (err) {
        if (!ignore) {
          setCars([]);
          setCarId("");
          setCarLoadError(err instanceof Error ? err.message : "Could not load available cars.");
        }
      } finally {
        if (!ignore) setLoadingCars(false);
      }
    }

    loadCars();

    return () => {
      ignore = true;
    };
  }, [endDate, hasValidDateRange, preselectedCarId, session?.token, startDate]);

  const selectedCar = useMemo(
    () => cars.find((c) => String(c.car_id) === String(carId)) || null,
    [cars, carId]
  );

  const estimatedTotal = selectedCar ? rentalDays * Number(selectedCar.daily_rate) : 0;

  function goToStep(index) {
    setError("");
    setStepIndex(index);
  }

  // ── Step 1: POST /rent → creates reservation ──────────────────────────────
  async function handleReserve(event) {
    event.preventDefault();
    setError("");

    if (!startDate || !endDate) { setError("Pick both a pickup and return date."); return; }
    if (rentalDays <= 0) { setError("Return date must be after the pickup date."); return; }
    if (!carId || !selectedCar) { setError("Select an available car for these dates."); return; }
    if (!pickupLocationId || !returnLocationId) { setError("Select pickup and return locations."); return; }

    setLoading(true);
    try {
      const data = await requestJson("/rent", {
        token: session?.token,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          car_id: carId,
          pickup_location_id: pickupLocationId,
          return_location_id: returnLocationId,
          start_date: startDate,
          planned_end_date: endDate,
        }),
        fallbackMessage: "Could not create reservation.",
      });

      setPendingRentalId(data.rental_id);
      goToStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create reservation.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: POST /rent/payment → pays invoice ─────────────────────────────
  async function handlePayment() {
    setError("");
    if (!pendingRentalId) { setError("Create a reservation before payment."); return; }
    if (!paymentMethodId) { setError("Select a payment method."); return; }

    setLoading(true);
    try {
      const data = await requestJson("/rent/payment", {
        token: session?.token,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rental_id: pendingRentalId,
          payment_method_id: paymentMethodId,
          discount_code: couponCode || null,
        }),
        fallbackMessage: "Payment failed.",
      });

      setConfirmation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setLoading(false);
    }
  }

  if (confirmation) {
    return (
      <PageShell session={session} onLogout={onLogout}>
        <PageSection eyebrow="Reservation complete" title="Booking confirmed" subtitle="Your car is booked and the payment is complete.">
          <section className="auth-layout" style={{ marginLeft: 0 }}>
            <article className="car-card">
              <h2>{selectedCar?.brand} {selectedCar?.model}</h2>
              <div className="car-details">
                <p><span>Invoice</span><strong>{confirmation.invoice_number || "—"}</strong></p>
                <p><span>Pickup</span><strong>{startDate}</strong></p>
                <p><span>Return</span><strong>{endDate}</strong></p>
                <p><span>Base amount</span><strong>{confirmation.base_amount} zł</strong></p>
                {Number(confirmation.discount_amount) > 0 && (
                  <p><span>Discount</span><strong>−{confirmation.discount_amount} zł</strong></p>
                )}
                <p><span>Total paid</span><strong>{confirmation.total_amount} zł</strong></p>
              </div>
            </article>
            <div className="hero-actions">
              <Link className="primary-link" to={userHistoryPath}>View rental history</Link>
              <Link className="back-link" to={userAreaPath} style={{ marginLeft: 12 }}>Back to user area</Link>
            </div>
          </section>
        </PageSection>
      </PageShell>
    );
  }

  if (loadingLookups && !lookups) {
    return (
      <PageShell session={session} onLogout={onLogout}>
        <PageSection eyebrow="Reservation" title="Rent a car" subtitle="">
          <p className="status-text">Loading available cars…</p>
        </PageSection>
      </PageShell>
    );
  }

  if (loadError && !lookups) {
    return (
      <PageShell session={session} onLogout={onLogout}>
        <PageSection eyebrow="Reservation" title="Rent a car" subtitle="">
          <p className="status-text error-text">{loadError}</p>
          <div className="hero-actions"><Link className="back-link" to={userAreaPath}>← Back</Link></div>
        </PageSection>
      </PageShell>
    );
  }

  const locations = lookups?.locations || [];
  const paymentMethods = lookups?.payment_methods || [];

  return (
    <PageShell session={session} onLogout={onLogout}>
      <PageSection
        eyebrow="Reservation"
        title="Rent a car"
        subtitle="Pick your dates and locations, then confirm payment."
      >
        <div className="hero-actions" style={{ marginTop: 0 }}>
          <Link className="back-link" to={userAreaPath}>← Back to user area</Link>
        </div>

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

          {stepIndex === 0 && (
            <form className="rent-flow-form" onSubmit={handleReserve}>
              <label>
                Car
                <select value={carId} onChange={(e) => setCarId(e.target.value)} disabled={loadingCars || cars.length === 0}>
                  {cars.length === 0 && <option value="">No cars available</option>}
                  {cars.map((car) => (
                    <option key={car.car_id} value={car.car_id}>
                      {car.brand} {car.model} ({car.production_year}) - {car.daily_rate} zł/day
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Pickup date
                <input type="date" value={startDate} min={today()} onChange={(e) => setStartDate(e.target.value)} required />
              </label>

              <label>
                Return date
                <input type="date" value={endDate} min={startDate || today()} onChange={(e) => setEndDate(e.target.value)} required />
              </label>

              <label>
                Pickup location
                <select value={pickupLocationId} onChange={(e) => setPickupLocationId(e.target.value)} required>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Return location
                <select value={returnLocationId} onChange={(e) => setReturnLocationId(e.target.value)} required>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </label>

              {loadingCars && <p className="status-text">Checking available cars...</p>}
              {carLoadError && <p className="status-text error-text">{carLoadError}</p>}
              {!loadingCars && !carLoadError && hasValidDateRange && cars.length === 0 && (
                <p className="status-text">No cars are available for these dates.</p>
              )}
              {error && <p className="status-text error-text">{error}</p>}

              <button type="submit" className="primary-link auth-submit" disabled={loading || loadingCars || cars.length === 0}>
                {loading ? "Creating reservation…" : "Continue to checkout"}
              </button>
            </form>
          )}

          {stepIndex === 1 && (
            <div className="rent-flow-form">
              <label>
                Payment method
                <select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id}>{pm.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Coupon code (optional)
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="e.g. TEST10"
                />
              </label>

              {error && <p className="status-text error-text">{error}</p>}

              <div className="hero-actions" style={{ marginTop: 0 }}>
                <button type="button" className="back-link" onClick={() => goToStep(0)} disabled={loading}>
                  ← Back
                </button>
                <button
                  type="button"
                  className="primary-link auth-submit"
                  style={{ marginLeft: 12 }}
                  onClick={handlePayment}
                  disabled={loading}
                >
                  {loading ? "Processing…" : "Confirm payment"}
                </button>
              </div>

              <p style={{ fontSize: "0.85rem", opacity: 0.6, marginTop: 4 }}>
                Any valid discount is applied before the payment is completed.
              </p>
            </div>
          )}

          <aside className="rent-summary-card">
            <h2>Order summary</h2>
            <div className="car-details">
              <p><span>Car</span><strong>{selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : "—"}</strong></p>
              <p><span>Daily rate</span><strong>{selectedCar ? `${selectedCar.daily_rate} zł` : "—"}</strong></p>
              <p><span>Fuel</span><strong>{selectedCar?.fuel_type?.name || "—"}</strong></p>
              <p><span>Transmission</span><strong>{selectedCar?.transmission?.name || "—"}</strong></p>
              <p><span>Pickup</span><strong>{startDate || "—"}</strong></p>
              <p><span>Return</span><strong>{endDate || "—"}</strong></p>
              <p><span>Days</span><strong>{rentalDays || "—"}</strong></p>
              <p><span>Before discounts</span><strong>{estimatedTotal ? `${estimatedTotal} zł` : "—"}</strong></p>
            </div>
          </aside>
        </div>
      </PageSection>
    </PageShell>
  );
}
