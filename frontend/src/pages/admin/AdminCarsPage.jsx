import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import AdminCarFormModal from "../../components/AdminCarFormModal.jsx";
import CarModal from "../../components/CarModal.jsx";
import { PageShell, PageSection } from "../../components/PageShell.jsx";
import { requestJson } from "../../lib/api.js";


export default function AdminCarsPage({ session, onLogout }) {
  const [cars, setCars] = useState([]);
  const [lookups, setLookups] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCar, setSelectedCar] = useState(null);
  const [editorCar, setEditorCar] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    async function loadCars() {
      try {
        const [carsData, lookupsData] = await Promise.all([
          requestJson("/admin/cars", { token: session?.token, fallbackMessage: "Failed to load cars" }),
          requestJson("/admin/lookups", { token: session?.token, fallbackMessage: "Failed to load lookups" }),
        ]);

        setCars(Array.isArray(carsData) ? carsData : []);
        setLookups(lookupsData || null);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not load cars.");
      } finally {
        setLoading(false);
      }
    }

    loadCars();
  }, [session?.token]);

  async function refreshCars() {
    const data = await requestJson("/admin/cars", {
      token: session?.token,
      fallbackMessage: "Failed to refresh cars",
    });

    setCars(Array.isArray(data) ? data : []);
  }

  function openCreateCar() {
    setEditorCar(null);
    setEditorOpen(true);
  }

  function openEditCar(car) {
    setEditorCar(car);
    setEditorOpen(true);
    setSelectedCar(null);
  }

  async function handleDeleteCar(car) {
    if (!window.confirm(`Delete ${car.brand} ${car.model}?`)) return;

    try {
      await requestJson(`/admin/cars/${car.car_id}`, {
        token: session?.token,
        method: "DELETE",
        fallbackMessage: "Failed to delete car",
      });

      setCars((previous) => previous.filter((item) => item.car_id !== car.car_id));
      setSelectedCar(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not delete car.");
    }
  }

  async function handleSavedCar(savedCar) {
    setEditorOpen(false);
    setEditorCar(null);
    setError("");

    if (!savedCar?.car_id) {
      await refreshCars();
      return;
    }

    setCars((previous) => {
      const exists = previous.some((car) => car.car_id === savedCar.car_id);
      if (!exists) return [savedCar, ...previous];
      return previous.map((car) => (car.car_id === savedCar.car_id ? savedCar : car));
    });
  }

  return (
    <PageShell session={session} onLogout={onLogout}>
      <PageSection eyebrow="Management" title="Cars" subtitle="Keep vehicle details, rates, and availability up to date.">
        <div className="hero-actions" style={{ marginTop: 0, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="back-link" to="/admin">← Back to dashboard</Link>
          <button className="button-pill" type="button" onClick={openCreateCar}>
            + Register new vehicle
          </button>
        </div>

        {loading && <p className="status-text">Loading cars…</p>}
        {error && <p className="status-text error-text">{error}</p>}
        {!loading && !error && cars.length === 0 && <p className="status-text">No cars found.</p>}

        {cars.length > 0 && (
          <section className="cars-grid">
            {cars.map((car) => (
              <article
                className="car-card car-card-clickable"
                key={car.car_id || car.id}
                onClick={() => setSelectedCar(car)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setSelectedCar(car)}
              >
                <div className="car-card-top">
                  <span className="car-status">{car.car_status?.name || "Unknown status"}</span>
                  <span className="car-year">{car.production_year}</span>
                </div>

                <h2>{car.brand} {car.model}</h2>

                <div className="car-details">
                  <p><span>Daily rate</span><strong>{car.daily_rate} zł</strong></p>
                  <p><span>Plate</span><strong>{car.plate_number}</strong></p>
                  <p><span>Fuel</span><strong>{car.fuel_type?.name || "—"}</strong></p>
                  <p><span>Transmission</span><strong>{car.transmission?.name || "—"}</strong></p>
                </div>

                <div className="car-card-hint">Click for full details</div>
              </article>
            ))}
          </section>
        )}
      </PageSection>

      {selectedCar && (
        <CarModal
          car={selectedCar}
          showRentAction={false}
          onClose={() => setSelectedCar(null)}
          actions={[
            <button
              key="edit"
              className="button-pill"
              type="button"
              onClick={() => openEditCar(selectedCar)}
            >
              Edit car
            </button>,
            <button
              key="delete"
              className="button-pill button-pill-danger"
              type="button"
              onClick={() => handleDeleteCar(selectedCar)}
            >
              Delete car
            </button>,
          ]}
        />
      )}

      {editorOpen && (
        <AdminCarFormModal
          session={session}
          car={editorCar}
          lookups={lookups}
          onClose={() => {
            setEditorOpen(false);
            setEditorCar(null);
          }}
          onSaved={handleSavedCar}
        />
      )}
    </PageShell>
  );
}
