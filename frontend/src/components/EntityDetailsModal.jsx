import { useEffect } from "react";

function normalizeValue(value) {
  if (value == null || value === "") return "N/A";
  if (typeof value === "object") {
    return value.name ?? value.label ?? value.value ?? value.title ?? "N/A";
  }
  return String(value);
}

export default function EntityDetailsModal({ title, badges = [], description, details = [], onClose }) {
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

  return (
    <div className="car-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="car-modal" onClick={(event) => event.stopPropagation()}>
        <button className="car-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="car-modal-header">
          {badges.length > 0 && (
            <div className="car-modal-badges">
              {badges.map((badge) => (
                <span className="car-status" key={`${badge.label}:${badge.value}`}>
                  {badge.label}: {normalizeValue(badge.value)}
                </span>
              ))}
            </div>
          )}

          <h2 className="car-modal-title">{title}</h2>
          {description && <p className="car-modal-description">{description}</p>}
        </div>

        <div className="car-modal-body">
          <div className="car-modal-details">
            {details.map((detail) => (
              <div className="car-modal-detail-item" key={detail.label}>
                <span className="car-modal-detail-label">{detail.label}</span>
                <strong className={`car-modal-detail-value${detail.monospace ? " car-modal-id" : ""}`}>
                  {normalizeValue(detail.value)}
                </strong>
              </div>
            ))}
          </div>
        </div>

        <div className="car-modal-footer">
          <button className="back-link car-modal-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}