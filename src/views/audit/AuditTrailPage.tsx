import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { SidePanel } from "../../ui/SidePanel";
import { ActionButton } from "../../ui/ActionButton";
import { Popover } from "../../ui/Popover";
import type { AuditEvent } from "../../domain/types";
import { getEnumParam, getStringParam } from "../../router/query";
import { useFinancePrototypeState } from "../../state/FinancePrototypeState";

function toneForSeverity(s: AuditEvent["severity"]) {
  if (s === "Exception") return "danger";
  if (s === "Warning") return "warning";
  return "neutral";
}

export function AuditTrailPage() {
  const navigate = useNavigate();
  const loc = useLocation();
  const { auditEvents: allEvents } = useFinancePrototypeState();
  const params = React.useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const initialSev = getEnumParam<AuditEvent["severity"]>(
    params,
    "severity",
    ["Info", "Warning", "Exception"] as const
  );
  const initialQ = getStringParam(params, "q");
  const initialFrom = getStringParam(params, "from");
  const initialTo = getStringParam(params, "to");

  const [sev, setSev] = React.useState<AuditEvent["severity"] | "All">(initialSev ?? "All");
  const [q, setQ] = React.useState(initialQ ?? "");
  const [from, setFrom] = React.useState(initialFrom ?? "");
  const [to, setTo] = React.useState(initialTo ?? "");
  const [selectedEvent, setSelectedEvent] = React.useState<AuditEvent | null>(null);

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (sev === "All") url.searchParams.delete("severity");
    else url.searchParams.set("severity", sev);
    if (!q.trim()) url.searchParams.delete("q");
    else url.searchParams.set("q", q.trim());
    if (!from.trim()) url.searchParams.delete("from");
    else url.searchParams.set("from", from.trim());
    if (!to.trim()) url.searchParams.delete("to");
    else url.searchParams.set("to", to.trim());
    navigate(`${loc.pathname}?${url.searchParams.toString()}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sev, q, from, to]);

  const filtered = allEvents
    .filter((e) => (sev === "All" ? true : e.severity === sev))
    .filter((e) => {
      const d = new Date(e.at).toISOString().slice(0, 10);
      if (from.trim() && d < from.trim()) return false;
      if (to.trim() && d > to.trim()) return false;
      return true;
    })
    .filter((e) => {
      if (!q.trim()) return true;
      const needle = q.toLowerCase();
      return (
        e.actor.toLowerCase().includes(needle) ||
        e.action.toLowerCase().includes(needle) ||
        e.target.toLowerCase().includes(needle) ||
        e.summary.toLowerCase().includes(needle)
      );
    })
    .sort((a, b) => (a.at < b.at ? 1 : -1));

  function sourceModuleForTarget(target: string) {
    if (target.startsWith("drf_")) return "Drafts";
    if (target.startsWith("inv_")) return "Invoices / Receivables";
    if (target.startsWith("pr_")) return "Purchase Requests";
    if (target.startsWith("sb_")) return "Supplier Bills";
    if (target.startsWith("pay_")) return "Payments Queue";
    if (target.startsWith("bud_")) return "Budget";
    if (target.startsWith("emp_")) return "Employee Costs";
    return "—";
  }

  function navigateToTarget(event: AuditEvent) {
    const t = event.target;
    if (t.startsWith("inv_")) navigate(`/finance/revenue/invoices/${encodeURIComponent(t)}`);
    else if (t.startsWith("pr_")) navigate(`/finance/spend/requests/${encodeURIComponent(t)}`);
    else if (t.startsWith("sb_")) navigate(`/finance/spend/bills/${encodeURIComponent(t)}`);
    else if (t.startsWith("pay_")) navigate(`/finance/spend/payments?q=${encodeURIComponent(t)}`);
    else if (t.startsWith("drf_")) navigate(`/finance/revenue/drafts?q=${encodeURIComponent(t)}`);
    else if (t.startsWith("bud_")) navigate(`/finance/control/budgets`);
    else if (t.startsWith("emp_")) navigate(`/finance/control/employee-costs`);
    else navigate(`/finance/control/audit`);
  }

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Audit Trail</h1>
          <p>Ιχνηλασιμότητα ενεργειών (drafts, έκδοση, approvals, blocked, exceptions) σε ενιαίο timeline.</p>
        </div>
        <div className="row">
          <button className="btn">Εξαγωγή</button>
          <button className="btn primary" disabled title="v1: δεν υποστηρίζεται καταχώρηση σημείωσης στο audit.">
            Σημείωση (v1: όχι διαθέσιμο)
          </button>
        </div>
      </div>

      <div className="invoice-filters-bar">
        <div className="invoice-filters-row">
          <div className="invoice-filters-main">
            <div className="field invoice-filter-field invoice-filter-field--wide">
            <label>Αναζήτηση</label>
            <input
              className="input"
              placeholder="Χρήστης, ενέργεια, στόχος…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            </div>
            <div className="field invoice-filter-field">
              <label>Σοβαρότητα</label>
              <select className="select" value={sev} onChange={(e) => setSev(e.target.value as AuditEvent["severity"] | "All")}>
                <option value="All">Όλα</option>
                <option value="Info">Info</option>
                <option value="Warning">Warning</option>
                <option value="Exception">Exception</option>
              </select>
            </div>
            <Popover
              placement="bottom-end"
              trigger={({ ref, onClick, "aria-expanded": ariaExpanded }) => (
                <button ref={ref} className="btn btn--sm" onClick={onClick} aria-expanded={ariaExpanded}>
                  <i className="bi bi-funnel" aria-hidden="true" />
                  <span>Φίλτρα</span>
                </button>
              )}
            >
              <div className="filters-more">
                <div className="filters-more__item">
                  <div className="field invoice-filter-field">
                    <label>Από</label>
                    <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                  </div>
                </div>
                <div className="filters-more__item">
                  <div className="field invoice-filter-field">
                    <label>Έως</label>
                    <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                  </div>
                </div>
              </div>
            </Popover>
            <button
              className="btn ghost btn--sm"
              onClick={() => {
                setSev("All");
                setQ("");
                setFrom("");
                setTo("");
              }}
              title="Εκκαθάριση φίλτρων"
            >
              <span>Εκκαθάριση</span>
            </button>
          </div>
          <div className="invoice-filters-right">
            <Chip tone="neutral">{filtered.length} συμβάντα</Chip>
          </div>
        </div>
      </div>

      <div className="finance-spacer" />

      <Card title="Activity">
        <div className="finance-table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Χρόνος</th>
                <th>Χρήστης</th>
                <th>Ενέργεια</th>
                <th>Στόχος</th>
                <th>Ενότητα</th>
                <th>Σύνοψη</th>
                <th>Σοβαρότητα</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => setSelectedEvent(e)}
                  className="finance-table-clickrow"
                >
                  <td className="muted">{new Date(e.at).toISOString().replace("T", " ").slice(0, 16)}</td>
                  <td>{e.actor}</td>
                  <td className="muted">{e.action}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{e.target}</td>
                  <td className="muted">{sourceModuleForTarget(e.target)}</td>
                  <td>{e.summary}</td>
                  <td>
                    <Chip tone={toneForSeverity(e.severity)}>{e.severity}</Chip>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted" style={{ padding: 16 }}>
                    No audit events found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <SidePanel
        open={!!selectedEvent}
        title={selectedEvent ? `Audit event ${selectedEvent.id}` : "Audit event"}
        onClose={() => setSelectedEvent(null)}
      >
        {selectedEvent ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <Chip tone={toneForSeverity(selectedEvent.severity)}>{selectedEvent.severity}</Chip>
              <Chip tone="neutral">{sourceModuleForTarget(selectedEvent.target)}</Chip>
            </div>
            <div className="divider" />
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Timestamp
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                {new Date(selectedEvent.at).toISOString().replace("T", " ").slice(0, 16)}
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Actor / Action
              </div>
              <div>
                {selectedEvent.actor} · {selectedEvent.action}
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Target record
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{selectedEvent.target}</div>
            </div>
            <div className="finance-warning-box" style={{ background: "var(--finance-surface-2)", borderColor: "rgba(15,23,42,0.10)" }}>
              <div className="muted" style={{ fontSize: 12 }}>
                Summary
              </div>
              <div style={{ marginTop: 6 }}>{selectedEvent.summary}</div>
            </div>
            <div className="row">
              <ActionButton onClick={() => navigateToTarget(selectedEvent)}>
                Open target record
              </ActionButton>
              <ActionButton
                disabled
                disabledReason="Prototype: event diff/before-after is not available in mock data."
              >
                View before/after
              </ActionButton>
            </div>
          </div>
        ) : null}
      </SidePanel>
    </>
  );
}

