import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Chip } from "../../../ui/Chip";

export type SummaryRow = {
  label: string;
  value: string;
  to?: string;
};

export type SummaryBucket = {
  label: string;
  value: string;
  tone?: "neutral" | "warning" | "danger";
};

export function OverviewSummaryCard({
  title,
  ctaLabel,
  ctaTo,
  primaryLabel,
  primaryValue,
  primaryTo,
  buckets,
  rows
}: {
  title: string;
  ctaLabel: string;
  ctaTo: string;
  primaryLabel?: string;
  primaryValue?: string;
  primaryTo?: string;
  buckets?: SummaryBucket[];
  rows: SummaryRow[];
}) {
  const navigate = useNavigate();
  const hasPrimary = primaryValue != null && primaryValue !== "";

  return (
    <section className="overview-summary-card">
      <div className="overview-summary-card__head">
        <h3 className="overview-summary-card__title">{title}</h3>
        <Link to={ctaTo} className="btn btn--sm">
          {ctaLabel}
        </Link>
      </div>
      <div className="overview-summary-card__body">
        {hasPrimary && (
          <div className="overview-summary-card__primary">
            <span className="overview-summary-card__primary-label">{primaryLabel}</span>
            {primaryTo ? (
              <button
                type="button"
                className="overview-summary-card__primary-value overview-summary-card__value--link"
                onClick={() => navigate(primaryTo)}
              >
                {primaryValue}
              </button>
            ) : (
              <span className="overview-summary-card__primary-value">{primaryValue}</span>
            )}
          </div>
        )}
        {buckets != null && buckets.length > 0 && (
          <div className="overview-summary-card__buckets">
            {buckets.map((b) => (
              <span key={b.label} className="overview-summary-card__bucket">
                <Chip tone={b.tone ?? "neutral"}>{b.label} {b.value}</Chip>
              </span>
            ))}
          </div>
        )}
        {rows.map((row, i) => (
          <div key={i} className="overview-summary-card__row">
            <span className="overview-summary-card__label">{row.label}</span>
            {row.to ? (
              <button
                type="button"
                className="overview-summary-card__value overview-summary-card__value--link"
                onClick={() => navigate(row.to!)}
              >
                {row.value}
              </button>
            ) : (
              <span className="overview-summary-card__value">{row.value}</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
