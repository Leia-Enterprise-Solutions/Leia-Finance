import React from "react";

export function SidePanel({
  open,
  title,
  onClose,
  children
}: {
  open: boolean;
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <>
      {open ? <div className="scrim" onClick={onClose} aria-hidden /> : null}
      <aside className="side-panel" data-open={open} aria-hidden={!open}>
        <div className="panel-h">
          <div style={{ fontWeight: 650, overflow: "hidden", textOverflow: "ellipsis" }}>
            {title}
          </div>
          <button className="btn ghost" onClick={onClose}>
            Κλείσιμο
          </button>
        </div>
        <div className="panel-b">{children}</div>
      </aside>
    </>
  );
}

