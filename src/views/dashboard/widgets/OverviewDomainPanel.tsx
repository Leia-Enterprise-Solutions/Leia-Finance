import React from "react";
import { Link } from "react-router-dom";

export function OverviewDomainPanel({
  title,
  totalLabel,
  totalValue,
  sublabel,
  ctaLabel,
  ctaTo,
  headerRight,
  children
}: {
  title: string;
  totalLabel: string;
  totalValue: string;
  sublabel: string;
  ctaLabel: string;
  ctaTo: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overview-domain-panel card">
      <div className="overview-domain-panel__head card-h">
        <div className="overview-domain-panel__header-inner">
          <div className="overview-domain-panel__title">{title}</div>
          <div className="overview-domain-panel__total">
            <span className="muted" style={{ fontSize: 12 }}>{totalLabel}</span>
            <span className="overview-domain-panel__total-value">{totalValue}</span>
          </div>
          <div className="muted overview-domain-panel__sublabel">{sublabel}</div>
        </div>
        <div className="overview-domain-panel__actions">
          {headerRight ? <div onClick={(e) => e.stopPropagation()}>{headerRight}</div> : null}
          <Link to={ctaTo} className="btn btn--sm">
            {ctaLabel}
          </Link>
        </div>
      </div>
      <div className="overview-domain-panel__body card-b">
        {children}
      </div>
    </section>
  );
}
