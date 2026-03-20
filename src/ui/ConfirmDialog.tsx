import React from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Επιβεβαίωση",
  cancelLabel = "Ακύρωση",
  tone = "neutral",
  onCancel,
  onConfirm
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "neutral" | "danger";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <>
      <div className="scrim" onClick={onCancel} aria-hidden />
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title}>
        <div className="dialog-card">
          <div className="dialog-h">
            <div style={{ fontWeight: 650 }}>{title}</div>
          </div>
          <div className="dialog-b">
            {description ? <div className="muted">{description}</div> : null}
          </div>
          <div className="dialog-f">
            <button className="btn" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button className={tone === "danger" ? "btn primary" : "btn primary"} onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

