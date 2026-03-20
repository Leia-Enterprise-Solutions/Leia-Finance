import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { SidePanel } from "../../ui/SidePanel";
import type { InvoiceDraft } from "../../domain/types";
import { invoiceDrafts as allDrafts } from "../../mock/data";
import { formatCurrency } from "../../domain/format";
import { getEnumParam, getStringParam } from "../../router/query";

function toneForDraftStatus(s: InvoiceDraft["status"]) {
  if (s === "Ready to Issue") return "success";
  if (s === "Stale") return "warning";
  return "neutral";
}

export function DraftsPage() {
  const navigate = useNavigate();
  const loc = useLocation();
  const params = React.useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const initialQ = getStringParam(params, "q");
  const initialStatus = getEnumParam<InvoiceDraft["status"]>(
    params,
    "status",
    ["In Progress", "Stale", "Ready to Issue"] as const
  );

  const [q, setQ] = React.useState(initialQ ?? "");
  const [status, setStatus] = React.useState<InvoiceDraft["status"] | "All">(initialStatus ?? "All");
  const [selected, setSelected] = React.useState<InvoiceDraft | null>(null);

  const filtered = allDrafts.filter((d) => {
    if (status !== "All" && d.status !== status) return false;
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return (
      d.client.toLowerCase().includes(needle) ||
      (d.project ?? "").toLowerCase().includes(needle) ||
      d.id.toLowerCase().includes(needle)
    );
  });

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (status === "All") url.searchParams.delete("status");
    else url.searchParams.set("status", status);
    if (!q.trim()) url.searchParams.delete("q");
    else url.searchParams.set("q", q.trim());
    navigate(`${loc.pathname}?${url.searchParams.toString()}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q]);

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Invoice Drafts</h1>
          <p>Draft triage: in-progress, stale, ready-to-issue, and reserved line visibility.</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => navigate("/drafts/builder")}>
            Open builder
          </button>
          <button className="btn primary">Create draft</button>
        </div>
      </div>

      <Card title="Filter">
        <div className="filters">
          <div className="field" style={{ minWidth: 240 }}>
            <label>Search</label>
            <input
              className="input"
              placeholder="Client, project, draft id…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="field" style={{ minWidth: 200 }}>
            <label>Status</label>
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value as InvoiceDraft["status"] | "All")}
            >
              <option value="All">All</option>
              <option value="In Progress">In progress</option>
              <option value="Stale">Stale</option>
              <option value="Ready to Issue">Ready to issue</option>
            </select>
          </div>
          <Chip tone="neutral">{filtered.length} drafts</Chip>
          <Chip tone="warning">{filtered.filter((d) => d.status === "Stale").length} stale</Chip>
          <Chip tone="success">
            {filtered.filter((d) => d.status === "Ready to Issue").length} ready
          </Chip>
        </div>
      </Card>

      <div style={{ height: 14 }} />

      <Card title="Drafts list">
        <div style={{ overflow: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Draft</th>
                <th>Client</th>
                <th>Project</th>
                <th>Updated</th>
                <th className="num">Total</th>
                <th className="num">Reserved lines</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} onClick={() => setSelected(d)} style={{ cursor: "pointer" }}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{d.id}</td>
                  <td>{d.client}</td>
                  <td className="muted">{d.project ?? "—"}</td>
                  <td className="muted">{new Date(d.updatedAt).toISOString().slice(0, 10)}</td>
                  <td className="num">{formatCurrency(d.draftTotal, d.currency)}</td>
                  <td className="num">{d.reservedLines}</td>
                  <td>
                    <Chip tone={toneForDraftStatus(d.status)}>{d.status}</Chip>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted" style={{ padding: 16 }}>
                    No drafts found. Try adjusting filters or create a new draft.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <SidePanel
        open={!!selected}
        title={selected ? `${selected.client} • ${selected.id}` : "Draft"}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <Chip tone={toneForDraftStatus(selected.status)}>{selected.status}</Chip>
              <Chip tone="neutral">{selected.reservedLines} reserved lines</Chip>
            </div>
            <div className="divider" />
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Draft total
              </div>
              <div style={{ fontWeight: 650, fontSize: 16 }}>
                {formatCurrency(selected.draftTotal, selected.currency)}
              </div>
            </div>
            {selected.status === "Stale" ? (
              <div className="card" style={{ padding: 12, background: "var(--c-warning-50)" }}>
                <div style={{ fontWeight: 650, color: "#92400e" }}>Stale draft</div>
                <div className="muted" style={{ marginTop: 4 }}>
                  Review reserved lines and either resume editing or discard to release them.
                </div>
              </div>
            ) : null}
            <div className="row">
              <button className="btn" onClick={() => navigate(`/drafts/${selected.id}/builder`)}>
                Resume (builder)
              </button>
              <button className="btn">Discard</button>
              <button className="btn primary" disabled={selected.status !== "Ready to Issue"}>
                Submit for issue
              </button>
            </div>
          </div>
        ) : null}
      </SidePanel>
    </>
  );
}

