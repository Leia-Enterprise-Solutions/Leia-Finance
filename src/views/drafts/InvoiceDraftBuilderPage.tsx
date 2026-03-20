import React from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { SidePanel } from "../../ui/SidePanel";
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

  const activeDraftId = draftId ?? "drf_new";
  const draftMeta = invoiceDrafts.find((d) => d.id === activeDraftId) ?? null;
  const [selectedClient, setSelectedClient] = React.useState<string>(draftMeta?.client ?? "Acme Holding");
  const [selectedProject, setSelectedProject] = React.useState<string>(draftMeta?.project ?? "Implementation");
  const [dueTerms, setDueTerms] = React.useState<"Net 15" | "Net 30" | "Net 45">("Net 30");
  const [notes, setNotes] = React.useState<string>("");
  const [confirmDiscardOpen, setConfirmDiscardOpen] = React.useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);

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

  const selectedSourceIds = React.useMemo(() => new Set(lines.map((l) => l.sourceId)), [lines]);
  const reservedByThisDraft = lines.length;
  const availableCount = pool.filter((w) => w.status === "Available" && !selectedSourceIds.has(w.id)).length;

  function staleAgeDays(d: { updatedAt: string }) {
    const updated = new Date(d.updatedAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - updated) / (1000 * 60 * 60 * 24)));
  }

  const isStale = draftMeta?.status === "Stale";
  const staleDays = draftMeta ? staleAgeDays(draftMeta) : 0;

  const dueDays = dueTerms === "Net 15" ? 15 : dueTerms === "Net 30" ? 30 : 45;
  const dueDatePreview = React.useMemo(() => {
    // Prototype-only: there is no issueDate yet on the builder meta; use today as reference.
    const d = new Date();
    d.setDate(d.getDate() + dueDays);
    return d.toISOString().slice(0, 10);
  }, [dueDays]);

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

  function updateLineDescription(lineId: string, nextDescription: string) {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, description: nextDescription } : l)));
  }

  function updateLineAmount(lineId: string, raw: string) {
    const parsed = raw.trim() === "" ? 0 : Number(raw);
    const safe = Number.isFinite(parsed) ? parsed : 0;
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, amount: safe } : l)));
  }

  const total = sumLines(lines);
  const currency = lines[0]?.currency ?? "EUR";

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Invoice Draft Builder</h1>
          <p>Billable pool → draft lines with reservation/duplicate prevention (mocked, UI-complete).</p>
          {draftMeta ? (
            <div className="row" style={{ marginTop: 10 }}>
              <Chip tone="neutral">{`Owner: ${draftMeta.owner}`}</Chip>
              <Chip tone={draftMeta.status === "Ready to Issue" ? "success" : draftMeta.status === "Stale" ? "warning" : "neutral"}>
                {draftMeta.status}
              </Chip>
              {isStale ? <Chip tone="warning">{`${staleDays}d stale`}</Chip> : null}
              <Chip tone="neutral">{`${draftMeta.reservedLines} reserved`}</Chip>
            </div>
          ) : null}
        </div>
        <div className="row">
          <Link className="btn" to="/finance/revenue/drafts">
            Back to drafts
          </Link>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <Card
          title="Billable source pool"
          right={
            <div className="row">
              <Chip tone="success">{availableCount} available</Chip>
              <Chip tone="warning">{reservedByOther} reserved elsewhere</Chip>
              <Chip tone="warning">{reservedByThisDraft} reserved in this draft</Chip>
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
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 }}>
              {pool.length === 0 ? (
                <div className="muted" style={{ padding: 16 }}>
                  No billable entries for this selection. Change client/project or clear search.
                </div>
              ) : null}

              {pool.map((w) => {
                const disabled = !canAddToDraft(w, activeDraftId) || lines.some((l) => l.sourceId === w.id);
                const isSelected = selectedSourceIds.has(w.id);
                const reserveLabel =
                  isSelected
                    ? "Reserved by this draft"
                    : w.status === "Reserved"
                      ? w.reservedByDraftId === activeDraftId
                        ? "Reserved by this draft"
                        : `Reserved by ${w.reservedByDraftId}`
                      : w.status === "Invoiced"
                        ? `Invoiced (${w.invoicedByInvoiceId})`
                        : "—";

                const displayStatus: BillableWorkItem["status"] | "Reserved" = isSelected ? "Reserved" : w.status;

                const addDisabledReason = !disabled
                  ? undefined
                  : isSelected
                    ? "Already added to this draft"
                    : !canAddToDraft(w, activeDraftId)
                      ? w.status === "Reserved"
                        ? `Reserved by ${w.reservedByDraftId}`
                        : w.status === "Invoiced"
                          ? `Already invoiced (${w.invoicedByInvoiceId})`
                          : "Not available"
                      : "Not available";

                return (
                  <div
                    key={w.id}
                    style={{
                      border: "1px solid var(--c-border)",
                      borderRadius: "var(--radius-md)",
                      background: "var(--c-surface)",
                      padding: 12,
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      justifyContent: "space-between"
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--c-muted)" }}>{w.id}</div>
                        <Chip tone={toneForWorkStatus(displayStatus)}>{displayStatus}</Chip>
                      </div>

                      <div style={{ marginTop: 6, fontSize: 12 }} className="muted">
                        {w.client} · {w.project ?? "—"} · {w.date}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>{w.description}</div>

                      <div style={{ marginTop: 6, fontSize: 12 }} className="muted">
                        {reserveLabel}
                      </div>
                    </div>

                    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <div className="num" style={{ fontWeight: 650 }}>
                        {formatCurrency(w.amount, w.currency)}
                      </div>

                      <button className="btn" disabled={disabled} onClick={() => add(w)} title={addDisabledReason}>
                        {isSelected ? "Added" : "Add"}
                      </button>

                      {w.status === "Reserved" && w.reservedByDraftId && w.reservedByDraftId !== activeDraftId ? (
                        <Link className="btn" to={`/finance/revenue/drafts/${w.reservedByDraftId}/builder`}>
                          Open reserving draft
                        </Link>
                      ) : null}

                      {w.status === "Invoiced" && w.invoicedByInvoiceId ? (
                        <Link className="btn" to={`/finance/revenue/invoices/${w.invoicedByInvoiceId}`}>
                          Open invoice
                        </Link>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

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
                Add is disabled for items already reserved elsewhere (<strong>{reservedByOther}</strong>) or
                invoiced (<strong>{invoicedCount}</strong>). Items already in this draft are shown as “Added”.
              </div>
            </div>

            <div style={{ overflow: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Linked source reference</th>
                    <th>Description</th>
                    <th className="num">Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{l.sourceId}</td>
                      <td>
                        <input
                          className="input"
                          style={{ width: "100%" }}
                          value={l.description}
                          onChange={(e) => updateLineDescription(l.id, e.target.value)}
                          aria-label="Line description"
                        />
                      </td>
                      <td className="num">
                        <input
                          className="input"
                          style={{ width: 120 }}
                          type="number"
                          step="0.01"
                          value={Number.isFinite(l.amount) ? l.amount : 0}
                          onChange={(e) => updateLineAmount(l.id, e.target.value)}
                          aria-label="Line amount"
                        />
                      </td>
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
          </div>
        </Card>

        <div style={{ gridColumn: "1 / -1" }}>
          <Card title="Totals & terms (preview)">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Subtotal
                </div>
                <div style={{ fontWeight: 650, fontSize: 16 }}>{formatCurrency(total, currency)}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Taxes
                </div>
                <div className="muted">Not implemented (v1 UI stub).</div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Total
                </div>
                <div style={{ fontWeight: 650, fontSize: 16 }}>{formatCurrency(total, currency)}</div>
              </div>

              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Due terms
                </div>
                <select
                  className="select"
                  value={dueTerms}
                  onChange={(e) => setDueTerms(e.target.value as "Net 15" | "Net 30" | "Net 45")}
                >
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                </select>
                <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                  Due date preview (prototype): {dueDatePreview}
                </div>
              </div>

              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Duplicate safety
                </div>
                <div className="muted">
                  Add is blocked for items reserved elsewhere (<strong>{reservedByOther}</strong>) or invoiced
                  (<strong>{invoicedCount}</strong>).
                </div>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Notes / internal memo
                </div>
                <textarea
                  className="input"
                  style={{ height: 90, paddingTop: 8 }}
                  placeholder="Invoice notes…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 5,
          background: "rgba(255, 255, 255, 0.72)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid var(--c-border)",
          paddingTop: 12,
          paddingBottom: 12,
          marginTop: 16
        }}
      >
        <div className="row" style={{ justifyContent: "space-between", padding: "0 4px" }}>
          <button className="btn" disabled={lines.length === 0} onClick={() => setConfirmDiscardOpen(true)}>
            Discard changes
          </button>
          <div className="row">
            <button className="btn" disabled={lines.length === 0} onClick={() => setConfirmSaveOpen(true)}>
              Save draft
            </button>
            <button className="btn primary" disabled={lines.length === 0} onClick={() => setReviewOpen(true)}>
              Review
            </button>
          </div>
        </div>
      </div>

      <SidePanel
        open={reviewOpen}
        title="Review draft"
        onClose={() => setReviewOpen(false)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <Chip tone="neutral">{`${lines.length} lines`}</Chip>
            <Chip tone="neutral">{formatCurrency(total, currency)}</Chip>
          </div>

          {isStale ? (
            <div className="card" style={{ padding: 12, background: "var(--c-warning-50)" }}>
              <div style={{ fontWeight: 650, color: "#92400e" }}>Stale draft</div>
              <div className="muted" style={{ marginTop: 4 }}>
                This draft is stale for {staleDays} days. Review reserved lines before proceeding.
              </div>
            </div>
          ) : null}

          <div className="card" style={{ padding: 12, background: "var(--c-surface-2)" }}>
            <div className="muted" style={{ fontSize: 12 }}>Reservation safety</div>
            <div style={{ marginTop: 6 }}>
              Add is blocked for items reserved elsewhere (<strong>{reservedByOther}</strong>) or invoiced
              (<strong>{invoicedCount}</strong>). Selected lines are “reserved in this draft”.
            </div>
          </div>

          <div>
            <div className="muted" style={{ fontSize: 12 }}>Due terms</div>
            <div style={{ fontWeight: 650 }}>{dueTerms}</div>
            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
              Due date preview (prototype): {dueDatePreview}
            </div>
          </div>

          <div>
            <div className="muted" style={{ fontSize: 12 }}>Selected lines (preview)</div>
            <div style={{ overflow: "auto", marginTop: 8 }}>
              <table className="table" style={{ marginBottom: 0 }}>
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Description</th>
                    <th className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.slice(0, 10).map((l) => (
                    <tr key={l.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{l.sourceId}</td>
                      <td>{l.description}</td>
                      <td className="num">{formatCurrency(l.amount, l.currency)}</td>
                    </tr>
                  ))}
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="muted" style={{ padding: 16 }}>
                        Empty draft. Add billable items first.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div className="muted" style={{ fontSize: 12 }}>Notes / internal memo</div>
            <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{notes ? notes : <span className="muted">—</span>}</div>
          </div>

          <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
            <button className="btn" onClick={() => setReviewOpen(false)}>
              Back to edit
            </button>
            <button className="btn primary" disabled>
              Proceed to issue
            </button>
          </div>
        </div>
      </SidePanel>

      <ConfirmDialog
        open={confirmDiscardOpen}
        title="Discard changes"
        description={`Prototype: discarding will clear ${lines.length} selected line(s) and release reservations in this UI.`}
        confirmLabel="Discard"
        tone="danger"
        onCancel={() => setConfirmDiscardOpen(false)}
        onConfirm={() => {
          setConfirmDiscardOpen(false);
          setLines(initial);
          setReviewOpen(false);
        }}
      />

      <ConfirmDialog
        open={confirmSaveOpen}
        title="Save draft"
        description="Prototype: save is simulated locally (no backend persistence yet)."
        confirmLabel="Save"
        tone="neutral"
        onCancel={() => setConfirmSaveOpen(false)}
        onConfirm={() => {
          setConfirmSaveOpen(false);
          setReviewOpen(false);
        }}
      />
    </>
  );
}

