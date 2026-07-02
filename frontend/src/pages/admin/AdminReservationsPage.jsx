import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import EntityDetailsModal from "../../components/EntityDetailsModal.jsx";
import { PageShell, PageSection } from "../../components/PageShell.jsx";
import { downloadBlob, requestJson, saveBlob } from "../../lib/api.js";

function formatValue(value) {
  return value ? new Date(value).toLocaleString() : "N/A";
}

function formatShortDate(value) {
  return value ? new Date(value).toLocaleDateString() : "N/A";
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

function buildIdMap(items, idField = "id") {
  const map = new Map();

  if (!Array.isArray(items)) return map;

  items.forEach((item) => {
    const id = item?.[idField];
    if (id) map.set(String(id), item);
  });

  return map;
}

function formatCustomer(customer) {
  if (!customer) return "Unknown customer";

  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim();
  return name || customer.email || "Unknown customer";
}

function formatCar(car) {
  if (!car) return "Unknown car";

  const modelName = [car.brand, car.model].filter(Boolean).join(" ").trim();
  const nameWithYear = [modelName, car.production_year].filter(Boolean).join(" ").trim();

  if (nameWithYear && car.plate_number) return `${nameWithYear} (${car.plate_number})`;
  return nameWithYear || car.plate_number || "Unknown car";
}

export default function AdminReservationsPage({ session, onLogout }) {
  const [reservations, setReservations] = useState([]);
  const [lookups, setLookups] = useState(null);
  const [cars, setCars] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReservation, setSelectedReservation] = useState(null);

  useEffect(() => {
    async function loadReservations() {
      try {
        const [reservationsData, lookupsData, carsData, customersData] = await Promise.all([
          requestJson("/admin/rentals", { token: session?.token, fallbackMessage: "Failed to load reservations" }),
          requestJson("/admin/lookups", { token: session?.token, fallbackMessage: "Failed to load lookups" }),
          requestJson("/admin/cars", { token: session?.token, fallbackMessage: "Failed to load cars" }),
          requestJson("/admin/customers", { token: session?.token, fallbackMessage: "Failed to load customers" }),
        ]);

        setReservations(Array.isArray(reservationsData) ? reservationsData : []);
        setLookups(lookupsData || null);
        setCars(Array.isArray(carsData) ? carsData : []);
        setCustomers(Array.isArray(customersData) ? customersData : []);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not load reservations.");
      } finally {
        setLoading(false);
      }
    }

    loadReservations();
  }, [session?.token]);

  const lookupMaps = useMemo(
    () => ({
      customers: buildIdMap(customers, "customer_id"),
      cars: buildIdMap(cars, "car_id"),
      locations: buildIdMap(lookups?.locations),
      rentalStatuses: buildIdMap(lookups?.rental_statuses),
    }),
    [cars, customers, lookups],
  );

  function getReservationDisplay(reservation) {
    const customer = lookupMaps.customers.get(String(reservation.customer_id));
    const car = lookupMaps.cars.get(String(reservation.car_id));
    const pickupLocation = lookupMaps.locations.get(String(reservation.pickup_location_id));
    const returnLocation = lookupMaps.locations.get(String(reservation.return_location_id));
    const rentalStatus = lookupMaps.rentalStatuses.get(String(reservation.rental_status_id));

    return {
      customer: formatCustomer(customer),
      customerEmail: customer?.email || "N/A",
      customerPhone: customer?.phone || "N/A",
      car: formatCar(car),
      pickupLocation: pickupLocation?.name || "Unknown pickup location",
      returnLocation: returnLocation?.name || "Unknown return location",
      status: rentalStatus?.name || "Unknown status",
      shortStartDate: formatShortDate(reservation.start_date),
    };
  }

  async function downloadInvoice(reservation) {
    try {
      const display = getReservationDisplay(reservation);
      const blob = await downloadBlob(`/admin/rentals/${reservation.rental_id}/invoice`, {
        token: session?.token,
        fallbackMessage: "Failed to download invoice",
      });
      saveBlob(blob, `invoice-${formatFilePart(display.customer)}-${formatFileDate(reservation.start_date)}.pdf`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not download invoice.");
    }
  }

  const selectedReservationDisplay = selectedReservation ? getReservationDisplay(selectedReservation) : null;

  return (
    <PageShell session={session} onLogout={onLogout}>
      <PageSection eyebrow="Management" title="Reservations" subtitle="Review bookings, rental dates, and invoice access.">
        <div className="hero-actions" style={{ marginTop: 0 }}>
          <Link className="back-link" to="/admin">
            ← Back to dashboard
          </Link>
        </div>

        {loading && <p className="status-text">Loading reservations...</p>}
        {error && <p className="status-text error-text">{error}</p>}
        {!loading && !error && reservations.length === 0 && <p className="status-text">No reservations found.</p>}

        {reservations.length > 0 && (
          <section className="cars-grid">
            {reservations.map((reservation) => {
              const display = getReservationDisplay(reservation);

              return (
                <article
                  className="car-card car-card-clickable"
                  key={reservation.rental_id}
                  onClick={() => setSelectedReservation(reservation)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedReservation(reservation);
                    }
                  }}
                >
                  <div className="car-card-top">
                    <span className="car-status">{display.status}</span>
                    <span className="car-year">{display.shortStartDate}</span>
                  </div>

                  <h2>{display.customer}</h2>

                  <div className="car-details">
                    <p>
                      <span>Car</span>
                      <strong>{display.car}</strong>
                    </p>
                    <p>
                      <span>Start</span>
                      <strong>{formatValue(reservation.start_date)}</strong>
                    </p>
                    <p>
                      <span>Planned end</span>
                      <strong>{formatValue(reservation.planned_end_date)}</strong>
                    </p>
                  </div>

                  <div className="car-card-hint">Click for full details</div>
                </article>
              );
            })}
          </section>
        )}
      </PageSection>

      {selectedReservation && selectedReservationDisplay && (
        <EntityDetailsModal
          title={`Reservation for ${selectedReservationDisplay.customer}`}
          description={selectedReservationDisplay.car}
          badges={[{ label: "Status", value: selectedReservationDisplay.status }]}
          details={[
            { label: "Customer", value: selectedReservationDisplay.customer },
            { label: "Customer email", value: selectedReservationDisplay.customerEmail },
            { label: "Customer phone", value: selectedReservationDisplay.customerPhone },
            { label: "Car", value: selectedReservationDisplay.car },
            { label: "Pickup location", value: selectedReservationDisplay.pickupLocation },
            { label: "Return location", value: selectedReservationDisplay.returnLocation },
            { label: "Status", value: selectedReservationDisplay.status },
            { label: "Start date", value: formatValue(selectedReservation.start_date) },
            { label: "Planned end", value: formatValue(selectedReservation.planned_end_date) },
            { label: "Actual end", value: formatValue(selectedReservation.actual_end_date) },
            { label: "Created", value: formatValue(selectedReservation.created_at) },
          ]}
          actions={[
            <button
              key="download-invoice"
              className="button-pill"
              type="button"
              onClick={() => downloadInvoice(selectedReservation)}
            >
              Get invoice
            </button>,
          ]}
          onClose={() => setSelectedReservation(null)}
        />
      )}
    </PageShell>
  );
}
