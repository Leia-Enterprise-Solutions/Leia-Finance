import React from "react";
import { useNavigate } from "react-router-dom";

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

  function getItemPresentation(item: ActionStripItem) {
    // Visual mapping for prototype demo only.
    if (item.id === "ar")
      return { title: "Απαιτήσεις", icon: "bi-exclamation-octagon", tone: "danger" as const };
    if (item.id === "ar_due")
      return { title: "Απαιτήσεις (λήγουν)", icon: "bi-clock-history", tone: "warning" as const };
    if (item.id === "ap")
      return { title: "Υποχρεώσεις", icon: "bi-bank", tone: "danger" as const };
    if (item.id === "ap_blk")
      return { title: "Υποχρεώσεις (blocked)", icon: "bi-slash-circle", tone: "warning" as const };
    if (item.id === "pq")
      return { title: "Πληρωμές", icon: "bi-slash-circle", tone: "warning" as const };
    if (item.id === "co")
      return { title: "Δεσμεύσεις", icon: "bi-cash-stack", tone: "neutral" as const };
    return { title: "Ενέργειες", icon: "bi-list-check", tone: "neutral" as const };
  }

  return (
    <div className="overview-action-strip__list" role="list">
      {items.map((item) => (
        <div
          key={item.id}
          className="overview-action-strip__item"
          role="listitem"
          tabIndex={0}
          onClick={() => navigate(item.ctaTo)}
        >
          {(() => {
            const pres = getItemPresentation(item);
            return (
              <>
                <div className={`overview-action-strip__icon overview-action-strip__icon--${pres.tone}`}>
                  <i className={`bi ${pres.icon}`} aria-hidden />
                </div>
                <div className="overview-action-strip__text">
                  <div className="overview-action-strip__title">{pres.title}</div>
                  <div className="overview-action-strip__subtitle">{item.label}</div>
                </div>
              </>
            );
          })()}
        </div>
      ))}
    </div>
  );
}
