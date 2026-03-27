import React from "react";

type Placement = "bottom-start" | "bottom-end" | "top-start" | "top-end";

export function Popover({
  trigger,
  placement = "bottom-start",
  open: controlledOpen,
  onOpenChange,
  children
}: {
  trigger: (props: { ref: React.Ref<HTMLButtonElement>; onClick: () => void; "aria-expanded": boolean }) => React.ReactNode;
  placement?: Placement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (btnRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, setOpen]);

  return (
    <div className="popover">
      {trigger({
        ref: btnRef,
        onClick: () => setOpen(!open),
        "aria-expanded": open
      })}
      {open ? (
        <div
          ref={panelRef}
          className="popover-panel"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: placement === "bottom-end" || placement === "top-end" ? "auto" : 0,
            right: placement === "bottom-end" || placement === "top-end" ? 0 : "auto",
            minWidth: "max(220px, 100%)"
          }}
          role="dialog"
          aria-modal="false"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

