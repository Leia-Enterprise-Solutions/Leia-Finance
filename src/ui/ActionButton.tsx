import React from "react";

export function ActionButton({
  children,
  onClick,
  variant = "default",
  disabled,
  disabledReason,
  title
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "ghost";
  disabled?: boolean;
  disabledReason?: string;
  title?: string;
}) {
  const className =
    variant === "primary" ? "btn primary" : variant === "ghost" ? "btn ghost" : "btn";

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <button
        className={className}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        title={disabled && disabledReason ? disabledReason : title}
      >
        {children}
      </button>
      {disabled && disabledReason ? (
        <span className="faint" style={{ fontSize: 11, maxWidth: 220, textAlign: "right" }}>
          {disabledReason}
        </span>
      ) : null}
    </span>
  );
}

