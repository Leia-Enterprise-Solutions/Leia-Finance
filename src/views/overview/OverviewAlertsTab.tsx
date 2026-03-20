import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chip } from "../../ui/Chip";
import { formatCurrency } from "../../domain/format";

type Severity = "Critical" | "Warning" | "Info";
type Domain = "Revenue" | "Spend" | "Control";

type AlertItem = {
  id: string;
  severity: Severity;
  domain: Domain;
  title: string;
  recordRef: string;
  linkedParty?: string;
  amount?: number;
  reason: string;
  daysOverdueOrStale?: number;
  owner?: string;
  ctaLabel: string;
  ctaTo: string;
};

const MOCK_ALERTS: AlertItem[] = [
  {
    id: "a1",
    severity: "Critical",
    domain: "Revenue",
    title: "Ληξιπρόθεσμη απαίτηση",
    recordRef: "INV-204",
    linkedParty: "Alpha SA",
    amount: 4800,
    reason: "18 ημέρες overdue",
    daysOverdueOrStale: 18,
    owner: "Maria K.",
    ctaLabel: "Άνοιγμα Collections",
    ctaTo: "/finance/revenue/collections?signal=Overdue"
  },
  {
    id: "a2",
    severity: "Critical",
    domain: "Spend",
    title: "Ληξιπρόθεσμη υποχρέωση",
    recordRef: "BILL-112",
    linkedParty: "Studio Kappa",
    amount: 2100,
    reason: "Λήξη πέρασε",
    daysOverdueOrStale: 5,
    ctaLabel: "Άνοιγμα Bill",
    ctaTo: "/finance/spend/bills?status=Overdue"
  },
  {
    id: "a3",
    severity: "Warning",
    domain: "Spend",
    title: "Blocked supplier bill",
    recordRef: "BILL-118",
    linkedParty: "Studio Kappa",
    amount: 2100,
    reason: "Missing attachment",
    owner: "Nikos P.",
    ctaLabel: "Άνοιγμα Bill Detail",
    ctaTo: "/finance/spend/bills"
  },
  {
    id: "a4",
    severity: "Warning",
    domain: "Spend",
    title: "Πληρωμή μπλοκαρισμένη",
    recordRef: "PAY-003",
    reason: "Αντιστοίχιση ποσού",
    ctaLabel: "Άνοιγμα Ουράς",
    ctaTo: "/finance/spend/payments"
  },
  {
    id: "a5",
    severity: "Warning",
    domain: "Revenue",
    title: "Draft stale",
    recordRef: "DRAFT-007",
    linkedParty: "Northwind Labs",
    reason: "Χωρίς αλλαγή 14+ ημέρες",
    daysOverdueOrStale: 14,
    owner: "Alex",
    ctaLabel: "Άνοιγμα Draft",
    ctaTo: "/finance/revenue/drafts"
  },
  {
    id: "a6",
    severity: "Info",
    domain: "Control",
    title: "Budget warning",
    recordRef: "OPEX-Q1",
    reason: "Πλησιάζει όριο γραμμής",
    ctaLabel: "Άνοιγμα Budgets",
    ctaTo: "/finance/control/budgets"
  },
  {
    id: "a7",
    severity: "Info",
    domain: "Revenue",
    title: "Partial payment / unallocated",
    recordRef: "INV-2026-01002",
    linkedParty: "Acme Holding",
    amount: 12500,
    reason: "Υπόλοιπο ανοικτό",
    ctaLabel: "Collections",
    ctaTo: "/finance/revenue/collections"
  }
];

function severityTone(s: Severity): "danger" | "warning" | "neutral" {
  if (s === "Critical") return "danger";
  if (s === "Warning") return "warning";
  return "neutral";
}

function domainLabel(d: Domain) {
  if (d === "Revenue") return "Έσοδα";
  if (d === "Spend") return "Δαπάνες";
  return "Έλεγχος";
}

export function OverviewAlertsTab() {
  const navigate = useNavigate();
  const [domainFilter, setDomainFilter] = useState<Domain | "All">("All");
  const [severityFilter, setSeverityFilter] = useState<Severity | "All">("All");
  const hasActiveFilters = domainFilter !== "All" || severityFilter !== "All";

  const filtered = useMemo(() => {
    return MOCK_ALERTS.filter((a) => {
      if (domainFilter !== "All" && a.domain !== domainFilter) return false;
      if (severityFilter !== "All" && a.severity !== severityFilter) return false;
      return true;
    });
  }, [domainFilter, severityFilter]);

  const summary = useMemo(() => {
    const critical = MOCK_ALERTS.filter((a) => a.severity === "Critical").length;
    const warning = MOCK_ALERTS.filter((a) => a.severity === "Warning").length;
    const info = MOCK_ALERTS.filter((a) => a.severity === "Info").length;
    return { critical, warning, info };
  }, []);

  const grouped = useMemo(() => {
    const critical = filtered.filter((a) => a.severity === "Critical");
    const warnings = filtered.filter((a) => a.severity === "Warning");
    const low = filtered.filter((a) => a.severity === "Info");
    return { critical, warnings, low };
  }, [filtered]);

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Ειδοποιήσεις / Εξαιρέσεις</h1>
          <p>Τι χρειάζεται προσοχή ή παρέμβαση τώρα.</p>
        </div>
      </div>

      <div className="overview-alerts-summary" style={{ marginBottom: 16 }}>
        <span className="muted">Σύνοψη: </span>
        <Chip tone="danger">Critical: {summary.critical}</Chip>
        <Chip tone="warning">Warning: {summary.warning}</Chip>
        <Chip tone="neutral">Info: {summary.info}</Chip>
      </div>

      <div className="overview-alerts-toolbar" style={{ marginBottom: 16 }}>
        <div className="overview-alerts-toolbar__left">
          <div className="overview-alerts-toolbar__group" aria-label="Domain filters">
            {(["All", "Revenue", "Spend", "Control"] as const).map((d) => (
              <button
                key={d}
                type="button"
                className={`chip ${domainFilter === d ? "chip--active" : ""}`}
                onClick={() => setDomainFilter(d)}
              >
                {d === "All" ? "Όλα" : d}
              </button>
            ))}
          </div>
          <span className="overview-alerts-toolbar__separator" aria-hidden="true" />
          <div className="overview-alerts-toolbar__group" aria-label="Severity filters">
            {(["All", "Critical", "Warning", "Info"] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={`chip ${severityFilter === s ? "chip--active" : ""}`}
                onClick={() => setSeverityFilter(s)}
              >
                {s === "All" ? "Όλα" : s}
              </button>
            ))}
          </div>
        </div>
        <div className="overview-alerts-toolbar__right">
          {hasActiveFilters ? (
            <button
              type="button"
              className="btn ghost btn--sm"
              onClick={() => {
                setDomainFilter("All");
                setSeverityFilter("All");
              }}
            >
              Καθαρισμός
            </button>
          ) : null}
        </div>
      </div>

      <div className="overview-alerts-list">
        {grouped.critical.length > 0 && (
          <section className="overview-alerts-group" aria-labelledby="alerts-critical">
            <h2 id="alerts-critical" className="overview-section__title" style={{ marginBottom: 8 }}>
              Κρίσιμα
            </h2>
            <ul className="overview-alerts-ul">
              {grouped.critical.map((a) => (
                <AlertRow key={a.id} item={a} onOpen={() => navigate(a.ctaTo)} />
              ))}
            </ul>
          </section>
        )}
        {grouped.warnings.length > 0 && (
          <section className="overview-alerts-group" aria-labelledby="alerts-warnings">
            <h2 id="alerts-warnings" className="overview-section__title" style={{ marginBottom: 8 }}>
              Προειδοποιήσεις
            </h2>
            <ul className="overview-alerts-ul">
              {grouped.warnings.map((a) => (
                <AlertRow key={a.id} item={a} onOpen={() => navigate(a.ctaTo)} />
              ))}
            </ul>
          </section>
        )}
        {grouped.low.length > 0 && (
          <section className="overview-alerts-group" aria-labelledby="alerts-info">
            <h2 id="alerts-info" className="overview-section__title" style={{ marginBottom: 8 }}>
              Πληροφορία
            </h2>
            <ul className="overview-alerts-ul">
              {grouped.low.map((a) => (
                <AlertRow key={a.id} item={a} onOpen={() => navigate(a.ctaTo)} />
              ))}
            </ul>
          </section>
        )}
        {filtered.length === 0 && (
          <p className="muted" style={{ padding: 24 }}>
            Δεν υπάρχουν ειδοποιήσεις για τα επιλεγμένα φίλτρα.
          </p>
        )}
      </div>
    </>
  );
}

function AlertRow({ item, onOpen }: { item: AlertItem; onOpen: () => void }) {
  return (
    <li className="overview-alert-row">
      <div className="overview-alert-row__main">
        <div className="overview-alert-row__meta">
          <Chip tone={severityTone(item.severity)}>{item.severity}</Chip>
          <Chip tone="neutral">{domainLabel(item.domain)}</Chip>
          <span className="overview-alert-row__ref">{item.recordRef}</span>
          <div className="overview-alert-row__metrics" data-tone={severityTone(item.severity)}>
            {item.amount != null ? (
              <span className="overview-alert-row__metric-box">{formatCurrency(item.amount)}</span>
            ) : null}
            {item.daysOverdueOrStale != null ? (
              <span className="overview-alert-row__metric-box">{item.daysOverdueOrStale} ημ.</span>
            ) : null}
          </div>
        </div>

        <div className="overview-alert-row__headline">
          <strong>{item.title}</strong>
        </div>

        <div className="overview-alert-row__details muted">
          <span>{item.reason}</span>
          {item.linkedParty ? <span>{item.linkedParty}</span> : null}
          {item.owner ? <span>Υπεύθυνος: {item.owner}</span> : null}
        </div>
      </div>
      <div className="overview-alert-row__action">
        <button type="button" className="btn btn--sm primary" onClick={onOpen}>
          {item.ctaLabel}
        </button>
      </div>
    </li>
  );
}
