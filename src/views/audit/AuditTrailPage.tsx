import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { SidePanel } from "../../ui/SidePanel";
import { ActionButton } from "../../ui/ActionButton";
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

  const [sev, setSev] = React.useState<AuditEvent["severity"] | "All">(initialSev ?? "All");
  const [q, setQ] = React.useState(initialQ ?? "");
  const [selectedEvent, setSelectedEvent] = React.useState<AuditEvent | null>(null);

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (sev === "All") url.searchParams.delete("severity");
    else url.searchParams.set("severity", sev);
    if (!q.trim()) url.searchParams.delete("q");
    else url.searchParams.set("q", q.trim());
    navigate(`${loc.pathname}?${url.searchParams.toString()}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sev, q]);

  const filtered = allEvents
    .filter((e) => (sev === "All" ? true : e.severity === sev))
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
          <p>Cross-module timeline: drafts, issues, receipts, approvals, blocked payables and exceptions.</p>
        </div>
        <div className="row">
          <button className="btn">Export</button>
          <button className="btn primary">Create note</button>
        </div>
      </div>

      <Card title="Filter">
        <div className="filters">
          <div className="field" style={{ minWidth: 240 }}>
            <label>Search</label>
            <input
              className="input"
              placeholder="Actor, action, target…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="field" style={{ minWidth: 180 }}>
            <label>Severity</label>
            <select className="select" value={sev} onChange={(e) => setSev(e.target.value as AuditEvent["severity"] | "All")}>
              <option value="All">All</option>
              <option value="Info">Info</option>
              <option value="Warning">Warning</option>
              <option value="Exception">Exception</option>
            </select>
          </div>
          <Chip tone="neutral">{filtered.length} events</Chip>
        </div>
      </Card>

      <div style={{ height: 14 }} />

      <Card title="Activity">
        <div style={{ overflow: "auto" }}>
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
                  style={{ cursor: "pointer" }}
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
            <div className="card" style={{ padding: 12, background: "var(--c-surface-2)" }}>
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

