import { useEffect, useState } from "react";

import { apiFetch, readJsonResponse } from "../lib/api.js";

function toStringValue(value) {
  if (value == null) return "";
  return String(value);
}

function buildInitialForm(car, lookups) {
  return {
    current_location_id: toStringValue(car?.current_location_id || lookups?.locations?.[0]?.id),
    fuel_type_id: toStringValue(car?.fuel_type_id || lookups?.fuel_types?.[0]?.id),
    transmission_id: toStringValue(car?.transmission_id || lookups?.transmissions?.[0]?.id),
    car_type_id: toStringValue(car?.car_type_id || lookups?.car_types?.[0]?.id),
    car_status_id: toStringValue(car?.car_status_id || lookups?.car_statuses?.[0]?.id),
    vin: car?.vin || "",
    plate_number: car?.plate_number || "",
    brand: car?.brand || "",
    model: car?.model || "",
    production_year: toStringValue(car?.production_year),
    color: car?.color || "",
    seats: toStringValue(car?.seats),
    mileage: toStringValue(car?.mileage),
    daily_rate: toStringValue(car?.daily_rate),
  };
}

function optionList(items = []) {
  return Array.isArray(items) ? items : [];
}

export default function AdminCarFormModal({ session, car, lookups, onClose, onSaved }) {
  const [formData, setFormData] = useState(() => buildInitialForm(car, lookups));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    setFormData(buildInitialForm(car, lookups));
    setError("");
  }, [car, lookups]);

  function updateField(field, value) {
    setFormData((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      current_location_id: formData.current_location_id,
      fuel_type_id: formData.fuel_type_id,
      transmission_id: formData.transmission_id,
      car_type_id: formData.car_type_id,
      car_status_id: formData.car_status_id,
      vin: formData.vin,
      plate_number: formData.plate_number,
      brand: formData.brand,
      model: formData.model,
      production_year: Number(formData.production_year),
      color: formData.color,
      seats: Number(formData.seats),
      mileage: Number(formData.mileage),
      daily_rate: formData.daily_rate,
    };

    try {
      const response = await apiFetch(`/admin/cars${car?.car_id ? `/${car.car_id}` : ""}`, {
        token: session?.token,
        method: car?.car_id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data?.detail || (car?.car_id ? "Failed to update car" : "Failed to create car"));
      }

      onSaved(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save car.");
    } finally {
      setLoading(false);
    }
  }

  const locationOptions = optionList(lookups?.locations);
  const fuelTypeOptions = optionList(lookups?.fuel_types);
  const transmissionOptions = optionList(lookups?.transmissions);
  const carTypeOptions = optionList(lookups?.car_types);
  const carStatusOptions = optionList(lookups?.car_statuses);

  return (
    <div className="car-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="car-modal car-modal-editor" onClick={(event) => event.stopPropagation()}>
        <button className="car-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="car-modal-header">
          <div className="car-modal-badges">
            <span className="car-status">Admin</span>
            <span className="car-year">Cars</span>
          </div>
          <h2 className="car-modal-title">{car?.car_id ? "Edit car" : "Register new vehicle"}</h2>
          <p className="car-modal-description">
            {car?.car_id ? "Update the vehicle using the admin PATCH endpoint." : "Create a new vehicle using the admin POST endpoint."}
          </p>
        </div>

        <form className="car-modal-body admin-car-form" onSubmit={handleSubmit}>
          <div className="admin-car-form-grid">
            <label>
              Location
              <select value={formData.current_location_id} onChange={(event) => updateField("current_location_id", event.target.value)} required>
                <option value="">Select location</option>
                {locationOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>

            <label>
              Fuel type
              <select value={formData.fuel_type_id} onChange={(event) => updateField("fuel_type_id", event.target.value)} required>
                <option value="">Select fuel type</option>
                {fuelTypeOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>

            <label>
              Transmission
              <select value={formData.transmission_id} onChange={(event) => updateField("transmission_id", event.target.value)} required>
                <option value="">Select transmission</option>
                {transmissionOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>

            <label>
              Car type
              <select value={formData.car_type_id} onChange={(event) => updateField("car_type_id", event.target.value)} required>
                <option value="">Select car type</option>
                {carTypeOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>

            <label>
              Car status
              <select value={formData.car_status_id} onChange={(event) => updateField("car_status_id", event.target.value)} required>
                <option value="">Select car status</option>
                {carStatusOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>

            <label>
              VIN
              <input type="text" value={formData.vin} onChange={(event) => updateField("vin", event.target.value)} required />
            </label>

            <label>
              Plate number
              <input type="text" value={formData.plate_number} onChange={(event) => updateField("plate_number", event.target.value)} required />
            </label>

            <label>
              Brand
              <input type="text" value={formData.brand} onChange={(event) => updateField("brand", event.target.value)} required />
            </label>

            <label>
              Model
              <input type="text" value={formData.model} onChange={(event) => updateField("model", event.target.value)} required />
            </label>

            <label>
              Production year
              <input type="number" min="1886" step="1" value={formData.production_year} onChange={(event) => updateField("production_year", event.target.value)} required />
            </label>

            <label>
              Color
              <input type="text" value={formData.color} onChange={(event) => updateField("color", event.target.value)} required />
            </label>

            <label>
              Seats
              <input type="number" min="1" step="1" value={formData.seats} onChange={(event) => updateField("seats", event.target.value)} required />
            </label>

            <label>
              Mileage
              <input type="number" min="0" step="1" value={formData.mileage} onChange={(event) => updateField("mileage", event.target.value)} required />
            </label>

            <label>
              Daily rate
              <input type="number" min="0" step="0.01" value={formData.daily_rate} onChange={(event) => updateField("daily_rate", event.target.value)} required />
            </label>
          </div>

          <div className="car-modal-footer">
            <button className="button-pill" type="submit" disabled={loading}>
              {loading ? "Saving..." : car?.car_id ? "Save changes" : "Register vehicle"}
            </button>
            <button className="back-link car-modal-close-btn" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>

          {error && <p className="status-text error-text" style={{ marginTop: 12 }}>{error}</p>}
        </form>
      </div>
    </div>
  );
}