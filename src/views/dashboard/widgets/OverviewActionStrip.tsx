import React from "react";
import { useNavigate } from "react-router-dom";
import { Chip } from "../../../ui/Chip";

export type ActionStripItem = {
  id: string;
  /** Short: "1 ληξιπρ.", "2 μπλοκ.", "13,4k δεσμεύσεις" */
  label: string;
  /** Optional small chip: "απαιτήσεις", "υποχρ.", "budget" */
  chip?: string;
  ctaTo: string;
};

export function OverviewActionStrip({ items }: { items: ActionStripItem[] }) {
  const navigate = useNavigate();

  return (
    <div className="overview-action-strip" role="list">
      {items.map((item) => (
        <div
          key={item.id}
          className="overview-action-strip__item"
          role="button"
          tabIndex={0}
          onClick={() => navigate(item.ctaTo)}
        >
          <div className="overview-action-strip__main">
            <span className="overview-action-strip__label">{item.label}</span>
            {item.chip != null && item.chip !== "" && (
              <span className="overview-action-strip__chip"><Chip tone="neutral">{item.chip}</Chip></span>
            )}
          </div>
          <span className="overview-action-strip__arrow" aria-hidden="true">→</span>
        </div>
      ))}
    </div>
  );
}
