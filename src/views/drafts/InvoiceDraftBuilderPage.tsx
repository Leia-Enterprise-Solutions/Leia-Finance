import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import type { BillableWorkItem, DraftLine } from "../../domain/types";
import { billableWork, draftLinesByDraftId, invoiceDrafts } from "../../mock/data";
import { formatCurrency } from "../../domain/format";

function toneForWorkStatus(s: BillableWorkItem["status"]) {
  if (s === "Available") return "success";
  if (s === "Reserved") return "warning";
  if (s === "Invoiced") return "neutral";
  return "neutral";
}

function canAddToDraft(item: BillableWorkItem, activeDraftId: string) {
  if (item.status === "Available") return true;
  if (item.status === "Reserved" && item.reservedByDraftId === activeDraftId) return true;
  return false;
}

function sumLines(lines: DraftLine[]) {
  return lines.reduce((a, l) => a + l.amount, 0);
}

export function InvoiceDraftBuilderPage() {
  const { draftId } = useParams();
  const navigate = useNavigate();

  const activeDraftId = draftId ?? "drf_new";
  const draftMeta = invoiceDrafts.find((d) => d.id === activeDraftId) ?? null;
  const [selectedClient, setSelectedClient] = React.useState<string>(draftMeta?.client ?? "Acme Holding");
  const [selectedProject, setSelectedProject] = React.useState<string>(draftMeta?.project ?? "Implementation");

  const initial = React.useMemo(() => draftLinesByDraftId[activeDraftId] ?? [], [activeDraftId]);
  const [lines, setLines] = React.useState<DraftLine[]>(initial);
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    setLines(draftLinesByDraftId[activeDraftId] ?? []);
  }, [activeDraftId]);

  const pool = billableWork
    .filter((w) => w.status !== "Non-billable")
    .filter((w) => (selectedClient ? w.client === selectedClient : true))
    .filter((w) => (selectedProject ? (w.project ?? "") === selectedProject : true))
    .filter((w) => {
      if (!q.trim()) return true;
      const needle = q.toLowerCase();
      return (
        w.id.toLowerCase().includes(needle) ||
        w.description.toLowerCase().includes(needle) ||
        w.client.toLowerCase().includes(needle)
      );
    });

  const reservedByOther = pool.filter((w) => w.status === "Reserved" && w.reservedByDraftId !== activeDraftId)
    .length;
  const invoicedCount = pool.filter((w) => w.status === "Invoiced").length;

  function add(item: BillableWorkItem) {
    if (!canAddToDraft(item, activeDraftId)) return;
    if (lines.some((l) => l.sourceId === item.id)) return;
    const id = `dl_${Math.random().toString(16).slice(2)}`;
    setLines((prev) => [
      ...prev,
      { id, sourceId: item.id, description: item.description, amount: item.amount, currency: item.currency }
    ]);
  }

  function remove(sourceId: string) {
    setLines((prev) => prev.filter((l) => l.sourceId !== sourceId));
  }

  const total = sumLines(lines);
  const currency = lines[0]?.currency ?? "EUR";

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Invoice Draft Builder</h1>
          <p>Billable pool → draft lines with reservation/duplicate prevention (mocked, UI-complete).</p>
        </div>
        <div className="row">
          <Link className="btn" to="/drafts">
            Back to drafts
          </Link>
          <button className="btn" onClick={() => navigate(`/drafts/${activeDraftId}/builder`)}>
            Open as route
          </button>
          <button className="btn primary" disabled={lines.length === 0}>
            Save draft
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <Card
          title="Billable source pool"
          right={
            <div className="row">
              <Chip tone="success">{pool.filter((w) => w.status === "Available").length} available</Chip>
              <Chip tone="warning">{reservedByOther} reserved</Chip>
              <Chip tone="neutral">{invoicedCount} invoiced</Chip>
            </div>
          }
        >
          <div className="filters" style={{ marginBottom: 12 }}>
            <div className="field" style={{ minWidth: 200 }}>
              <label>Client</label>
              <select className="select" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                {Array.from(new Set(billableWork.map((w) => w.client))).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ minWidth: 200 }}>
              <label>Project</label>
              <select className="select" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                {Array.from(
                  new Set(
                    billableWork
                      .filter((w) => w.client === selectedClient)
                      .map((w) => w.project ?? "—")
                  )
                ).map((p) => (
                  <option key={p} value={p === "—" ? "" : p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ minWidth: 240 }}>
              <label>Search</label>
              <input
                className="input"
                placeholder="id, description…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <div style={{ overflow: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th className="num">Amount</th>
                  <th>Status</th>
                  <th>Reserve</th>
                </tr>
              </thead>
              <tbody>
                {pool.map((w) => {
                  const disabled = !canAddToDraft(w, activeDraftId) || lines.some((l) => l.sourceId === w.id);
                  const reserveLabel =
                    w.status === "Reserved"
                      ? w.reservedByDraftId === activeDraftId
                        ? `Reserved by this draft`
                        : `Reserved by ${w.reservedByDraftId}`
                      : w.status === "Invoiced"
                        ? `Invoiced (${w.invoicedByInvoiceId})`
                        : "—";
                  return (
                    <tr key={w.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{w.id}</td>
                      <td className="muted">{w.date}</td>
                      <td>{w.description}</td>
                      <td className="num">{formatCurrency(w.amount, w.currency)}</td>
                      <td>
                        <Chip tone={toneForWorkStatus(w.status)}>{w.status}</Chip>
                      </td>
                      <td className="muted">
                        {reserveLabel}
                        <span style={{ marginLeft: 10 }} />
                        <button className="btn" disabled={disabled} onClick={() => add(w)}>
                          Add
                        </button>
                        {w.status === "Reserved" && w.reservedByDraftId && w.reservedByDraftId !== activeDraftId ? (
                          <Link className="btn" to={`/drafts/${w.reservedByDraftId}/builder`} style={{ marginLeft: 8 }}>
                            Open reserving draft
                          </Link>
                        ) : null}
                        {w.status === "Invoiced" && w.invoicedByInvoiceId ? (
                          <Link className="btn" to={`/invoices/${w.invoicedByInvoiceId}`} style={{ marginLeft: 8 }}>
                            Open invoice
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
                {pool.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="muted" style={{ padding: 16 }}>
                      No billable entries for this selection. Change client/project or clear search.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card
            title="Draft lines (selected)"
            right={
              <div className="row">
                <Chip tone="neutral">{lines.length} lines</Chip>
                <Chip tone="neutral">{formatCurrency(total, currency)}</Chip>
              </div>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="card" style={{ padding: 12, background: "var(--c-surface-2)" }}>
              <div className="muted" style={{ fontSize: 12 }}>
                Duplicate prevention / reservation rule (UI)
              </div>
              <div style={{ marginTop: 6 }}>
                Items already <strong>reserved by another draft</strong> or <strong>invoiced</strong> cannot be added.
              </div>
            </div>

            <div style={{ overflow: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Description</th>
                    <th className="num">Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{l.sourceId}</td>
                      <td>{l.description}</td>
                      <td className="num">{formatCurrency(l.amount, l.currency)}</td>
                      <td className="num">
                        <button className="btn" onClick={() => remove(l.sourceId)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="muted" style={{ padding: 16 }}>
                        Select billable items from the left to build the draft.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="row" style={{ justifyContent: "space-between" }}>
              <button className="btn" disabled={lines.length === 0}>
                Discard draft (release reservations)
              </button>
              <div className="row">
                <button className="btn" disabled={lines.length === 0}>
                  Submit for approval
                </button>
                <button className="btn primary" disabled={lines.length === 0}>
                  Submit for issue
                </button>
              </div>
            </div>
            </div>
          </Card>

          <Card title="Totals / Terms (placeholder)">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Terms
                </div>
                <select className="select" defaultValue="Net 30">
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                </select>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Tax preview (v1 UI stub)
                </div>
                <div className="muted">Not implemented (scope excludes tax engine).</div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Notes
                </div>
                <textarea className="input" style={{ height: 90, paddingTop: 8 }} placeholder="Invoice notes…" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

