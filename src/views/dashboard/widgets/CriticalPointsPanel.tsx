import React from "react";
import { useNavigate } from "react-router-dom";
import { Chip } from "../../../ui/Chip";

export type CriticalPointItem = {
  id: string;
  title: string;
  subtitle?: string;
  value: string;
  tone: "neutral" | "warning" | "danger";
  icon: string; // bootstrap icon class
  to: string;
};

export function CriticalPointsPanel({
  risks,
  nextSteps
}: {
  risks: CriticalPointItem[];
  nextSteps: CriticalPointItem[];
}) {
  const navigate = useNavigate();

  const renderItem = (it: CriticalPointItem) => (
    <button
      key={it.id}
      type="button"
      className="finance-critical-item"
      onClick={() => navigate(it.to)}
    >
      <span
        aria-hidden
        className="finance-critical-item__icon"
        data-tone={it.tone}
      >
        <i className={`bi ${it.icon}`} aria-hidden />
      </span>

      <span className="finance-critical-item__text">
        <span className="finance-critical-item__title">{it.title}</span>
        {it.subtitle ? (
          <span className="finance-critical-item__subtitle">
            {it.subtitle}
          </span>
        ) : null}
      </span>

      <span className="finance-critical-item__right">
        <Chip tone={it.tone}>{it.value}</Chip>
        <i className="bi bi-chevron-right muted" aria-hidden />
      </span>
    </button>
  );

  return (
    <div className="finance-stack">
      <div>
        <div className="finance-section-label">
          Κίνδυνοι
        </div>
        <div className="finance-critical-list">
          {risks.length ? risks.map(renderItem) : <div className="muted">Δεν υπάρχουν κρίσιμα ρίσκα.</div>}
        </div>
      </div>

      <div>
        <div className="finance-section-label">
          Επόμενα βήματα
        </div>
        <div className="finance-critical-list">
          {nextSteps.length ? nextSteps.map(renderItem) : <div className="muted">Δεν υπάρχουν εκκρεμότητες.</div>}
        </div>
      </div>
    </div>
  );
}

