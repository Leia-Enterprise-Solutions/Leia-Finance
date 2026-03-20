import React from "react";

export type ChipTone = "neutral" | "success" | "warning" | "danger";

export function Chip({
  tone = "neutral",
  children,
  title
}: {
  tone?: ChipTone;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <span className="chip" data-tone={tone} title={title}>
      {children}
    </span>
  );
}

