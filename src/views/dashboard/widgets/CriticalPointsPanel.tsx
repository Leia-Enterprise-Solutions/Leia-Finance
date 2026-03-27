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
  const [tab, setTab] = React.useState<"risks" | "next">(() => (risks.length ? "risks" : "next"));

  React.useEffect(() => {
    if (tab === "risks" && risks.length === 0 && nextSteps.length > 0) setTab("next");
    if (tab === "next" && nextSteps.length === 0 && risks.length > 0) setTab("risks");
  }, [risks.length, nextSteps.length, tab]);

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

  const list = tab === "risks" ? risks : nextSteps;
  const empty = tab === "risks" ? "Δεν υπάρχουν κρίσιμα ρίσκα." : "Δεν υπάρχουν εκκρεμότητες.";

  return (
    <div className="finance-stack">
      <div className="finance-tabs">
        <button
          type="button"
          className={`finance-tab ${tab === "risks" ? "finance-tab--active" : ""}`}
          onClick={() => setTab("risks")}
          aria-pressed={tab === "risks"}
        >
          Κίνδυνοι <span className="finance-tab__count">{risks.length}</span>
        </button>
        <button
          type="button"
          className={`finance-tab ${tab === "next" ? "finance-tab--active" : ""}`}
          onClick={() => setTab("next")}
          aria-pressed={tab === "next"}
        >
          Επόμενα βήματα <span className="finance-tab__count">{nextSteps.length}</span>
        </button>
      </div>

      <div className="finance-critical-list finance-critical-list--scroll">
        {list.length ? list.map(renderItem) : <div className="muted">{empty}</div>}
      </div>
    </div>
  );
}

