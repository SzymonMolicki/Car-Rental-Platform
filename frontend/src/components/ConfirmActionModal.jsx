import { useId, useRef } from "react";

import { useModalBehavior } from "../lib/modal.js";

export default function ConfirmActionModal({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
  confirmButtonClassName = "button-pill button-pill-danger",
}) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useModalBehavior(onClose, dialogRef);

  return (
    <div className="car-modal-backdrop" onClick={onClose}>
      <div
        className="car-modal confirm-modal"
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
          <h2 className="car-modal-title" id={titleId}>
            {title}
          </h2>
          {description && <p className="car-modal-description">{description}</p>}
        </div>

        <div className="car-modal-body confirm-modal-body">
          <p className="confirm-modal-message">This action cannot be undone.</p>
        </div>

        <div className="car-modal-footer confirm-modal-footer">
          <button className={confirmButtonClassName} type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button className="back-link car-modal-close-btn" type="button" onClick={onClose}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}