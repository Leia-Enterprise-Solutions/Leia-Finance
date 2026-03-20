import React from "react";

type Placement = "bottom-start" | "bottom-end";

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

  const [pos, setPos] = React.useState<{ top: number; left: number; minWidth: number }>({
    top: 0,
    left: 0,
    minWidth: 220
  });

  const recalc = React.useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const top = Math.round(r.bottom + 8 + window.scrollY);
    const minWidth = Math.max(220, Math.round(r.width));
    const left =
      placement === "bottom-end"
        ? Math.round(r.right + window.scrollX - minWidth)
        : Math.round(r.left + window.scrollX);
    setPos({ top, left, minWidth });
  }, [placement]);

  React.useEffect(() => {
    if (!open) return;
    recalc();
    const onResize = () => recalc();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, recalc]);

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
          style={{ position: "absolute", top: pos.top, left: pos.left, minWidth: pos.minWidth }}
          role="dialog"
          aria-modal="false"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

