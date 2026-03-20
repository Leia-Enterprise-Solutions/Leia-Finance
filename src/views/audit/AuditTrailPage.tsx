import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import type { AuditEvent } from "../../domain/types";
import { auditEvents as allEvents } from "../../mock/data";
import { getEnumParam, getStringParam } from "../../router/query";

function toneForSeverity(s: AuditEvent["severity"]) {
  if (s === "Exception") return "danger";
  if (s === "Warning") return "warning";
  return "neutral";
}

export function AuditTrailPage() {
  const navigate = useNavigate();
  const loc = useLocation();
  const params = React.useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const initialSev = getEnumParam<AuditEvent["severity"]>(
    params,
    "severity",
    ["Info", "Warning", "Exception"] as const
  );
  const initialQ = getStringParam(params, "q");

  const [sev, setSev] = React.useState<AuditEvent["severity"] | "All">(initialSev ?? "All");
  const [q, setQ] = React.useState(initialQ ?? "");

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
                <th>At</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Summary</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td className="muted">{new Date(e.at).toISOString().replace("T", " ").slice(0, 16)}</td>
                  <td>{e.actor}</td>
                  <td className="muted">{e.action}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{e.target}</td>
                  <td>{e.summary}</td>
                  <td>
                    <Chip tone={toneForSeverity(e.severity)}>{e.severity}</Chip>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted" style={{ padding: 16 }}>
                    No audit events found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

