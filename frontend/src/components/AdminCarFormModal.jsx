import { useEffect, useId, useRef, useState } from "react";

import { requestJson } from "../lib/api.js";
import { useModalBehavior } from "../lib/modal.js";

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

function AdminCarSection({ title, description, children }) {
  return (
    <fieldset className="admin-car-section">
      <legend>
        <span>{title}</span>
        {description && <small>{description}</small>}
      </legend>
      <div className="admin-car-form-grid">
        {children}
      </div>
    </fieldset>
  );
}

function SelectField({ label, value, onChange, children }) {
  return (
    <label className="admin-car-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} required>
        {children}
      </select>
    </label>
  );
}

function InputField({ label, value, onChange, type = "text", min, step, autoComplete }) {
  return (
    <label className="admin-car-field">
      <span>{label}</span>
      <input
        type={type}
        min={min}
        step={step}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </label>
  );
}

export default function AdminCarFormModal({ session, car, lookups, onClose, onSaved }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const [formData, setFormData] = useState(() => buildInitialForm(car, lookups));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useModalBehavior(onClose, dialogRef);

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
      const data = await requestJson(`/admin/cars${car?.car_id ? `/${car.car_id}` : ""}`, {
        token: session?.token,
        method: car?.car_id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        fallbackMessage: car?.car_id ? "Failed to update car" : "Failed to create car",
      });

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
    <div className="car-modal-backdrop" onClick={onClose}>
      <div
        className="car-modal car-modal-editor"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="car-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="car-modal-header">
          <div className="car-modal-badges">
            <span className="car-status">Fleet</span>
            <span className="car-year">Vehicle</span>
          </div>
          <h2 className="car-modal-title" id={titleId}>{car?.car_id ? "Edit car" : "Register new vehicle"}</h2>
          <p className="car-modal-description">
            {car?.car_id ? "Update this vehicle's details and availability." : "Add a vehicle to the rental fleet."}
          </p>
        </div>

        <form className="car-modal-body admin-car-form" onSubmit={handleSubmit}>
          <div className="admin-car-form-content">
            <AdminCarSection title="Vehicle details" description="Information customers use to recognize the car.">
              <InputField label="Brand" value={formData.brand} autoComplete="off" onChange={(value) => updateField("brand", value)} />
              <InputField label="Model" value={formData.model} autoComplete="off" onChange={(value) => updateField("model", value)} />
              <InputField
                label="Production year"
                type="number"
                min="1886"
                step="1"
                value={formData.production_year}
                onChange={(value) => updateField("production_year", value)}
              />
              <InputField label="Color" value={formData.color} autoComplete="off" onChange={(value) => updateField("color", value)} />
            </AdminCarSection>

            <AdminCarSection title="Registration" description="Unique vehicle identifiers and current odometer reading.">
              <InputField label="VIN" value={formData.vin} autoComplete="off" onChange={(value) => updateField("vin", value)} />
              <InputField label="Plate number" value={formData.plate_number} autoComplete="off" onChange={(value) => updateField("plate_number", value)} />
              <InputField
                label="Mileage"
                type="number"
                min="0"
                step="1"
                value={formData.mileage}
                onChange={(value) => updateField("mileage", value)}
              />
            </AdminCarSection>

            <AdminCarSection title="Rental setup" description="Availability, pricing, and features shown in the fleet.">
              <SelectField label="Location" value={formData.current_location_id} onChange={(value) => updateField("current_location_id", value)}>
                <option value="">Select location</option>
                {locationOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </SelectField>

              <SelectField label="Car status" value={formData.car_status_id} onChange={(value) => updateField("car_status_id", value)}>
                <option value="">Select car status</option>
                {carStatusOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </SelectField>

              <SelectField label="Car type" value={formData.car_type_id} onChange={(value) => updateField("car_type_id", value)}>
                <option value="">Select car type</option>
                {carTypeOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </SelectField>

              <SelectField label="Fuel type" value={formData.fuel_type_id} onChange={(value) => updateField("fuel_type_id", value)}>
                <option value="">Select fuel type</option>
                {fuelTypeOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </SelectField>

              <SelectField label="Transmission" value={formData.transmission_id} onChange={(value) => updateField("transmission_id", value)}>
                <option value="">Select transmission</option>
                {transmissionOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </SelectField>

              <InputField
                label="Seats"
                type="number"
                min="1"
                step="1"
                value={formData.seats}
                onChange={(value) => updateField("seats", value)}
              />
              <InputField
                label="Daily rate"
                type="number"
                min="0"
                step="0.01"
                value={formData.daily_rate}
                onChange={(value) => updateField("daily_rate", value)}
              />
            </AdminCarSection>
          </div>

          {error && <p className="status-text error-text admin-car-form-error">{error}</p>}

          <div className="car-modal-footer">
            <button className="button-pill" type="submit" disabled={loading}>
              {loading ? "Saving..." : car?.car_id ? "Save changes" : "Register vehicle"}
            </button>
            <button className="back-link car-modal-close-btn" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
