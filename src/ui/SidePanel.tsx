import React from "react";

type InertableHTMLElement = HTMLElement & { inert?: boolean };

export function SidePanel({
  open,
  title,
  onClose,
  children,
  size = "md"
}: {
  open: boolean;
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  size?: "md" | "lg";
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const panelRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const el = panelRef.current as InertableHTMLElement | null;
    if (!el) return;

    // If the panel is closing while focus is inside it, move focus away to avoid
    // aria-hidden descendants retaining focus (a11y warning).
    if (!open) {
      const active = document.activeElement;
      if (active && el.contains(active)) (active as HTMLElement).blur();
    }

    // Prefer inert when available: prevents focus + interaction while closed.
    el.inert = !open;
  }, [open]);

  return (
    <>
      {open ? <div className="scrim" onClick={onClose} aria-hidden /> : null}
      <aside ref={panelRef} className="side-panel" data-open={open} data-size={size} aria-hidden={!open}>
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

