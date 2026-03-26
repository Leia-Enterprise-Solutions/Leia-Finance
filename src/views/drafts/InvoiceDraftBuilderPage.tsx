import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { SidePanel } from "../../ui/SidePanel";
import type { BillableWorkItem, DraftLine } from "../../domain/types";
import { formatCurrency } from "../../domain/format";
import { useFinancePrototypeState } from "../../state/FinancePrototypeState";
import { usePermissions } from "../../state/permissions";

function toneForWorkStatus(s: BillableWorkItem["status"]) {
  if (s === "Available") return "success";
  if (s === "Reserved") return "warning";
  if (s === "Invoiced") return "neutral";
  return "neutral";
}

function labelForWorkStatus(s: BillableWorkItem["status"]) {
  if (s === "Available") return "Διαθέσιμο";
  if (s === "Reserved") return "Δεσμευμένο";
  if (s === "Invoiced") return "Τιμολογημένο";
  return s;
}

function toneForBillingType(t: BillableWorkItem["billingType"]) {
  return t === "Hourly" ? "neutral" : "success";
}

function labelForBillingType(t: BillableWorkItem["billingType"]) {
  return t === "Hourly" ? "Ωριαία" : "Σταθερή";
}

function computeWorkAmount(w: BillableWorkItem) {
  if (w.billingType === "Hourly") {
    const hours = w.hours ?? 0;
    const rate = w.rate ?? 0;
    const amt = hours * rate;
    return Number.isFinite(amt) ? amt : w.amount;
  }
  return w.amount;
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
  const perms = usePermissions();
  const {
    billableWork,
    invoiceDrafts,
    draftLinesByDraftId,
    upsertDraft,
    setDraftLines,
    issueDraft
  } = useFinancePrototypeState();

  const [activeDraftId, setActiveDraftId] = React.useState<string | null>(draftId ?? null);

  React.useEffect(() => {
    if (draftId) {
      setActiveDraftId(draftId);
      return;
    }
    // Canonicalize new draft into an id route so it can be referenced & audited.
    const id = `drf_${Date.now()}`;
    upsertDraft({
      id,
      client: "Acme Holding",
      project: "Implementation",
      owner: "Finance Operator",
      updatedAt: new Date().toISOString(),
      currency: "EUR",
      draftTotal: 0,
      reservedLines: 0,
      status: "In Progress"
    });
    setDraftLines(id, []);
    setActiveDraftId(id);
    navigate(`/finance/revenue/drafts/${encodeURIComponent(id)}/builder`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  const resolvedDraftId = activeDraftId ?? (draftId ?? "drf_new");
  const draftMeta = invoiceDrafts.find((d) => d.id === resolvedDraftId) ?? null;
  const [selectedClient, setSelectedClient] = React.useState<string>(draftMeta?.client ?? "Acme Holding");
  const [selectedProject, setSelectedProject] = React.useState<string>(draftMeta?.project ?? "Implementation");
  const [dueTerms, setDueTerms] = React.useState<"Net 15" | "Net 30" | "Net 45">("Net 30");
  const [notes, setNotes] = React.useState<string>("");
  const [confirmDiscardOpen, setConfirmDiscardOpen] = React.useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);

  const initial = React.useMemo(() => draftLinesByDraftId[resolvedDraftId] ?? [], [resolvedDraftId, draftLinesByDraftId]);
  const [lines, setLines] = React.useState<DraftLine[]>(initial);
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    setLines(draftLinesByDraftId[resolvedDraftId] ?? []);
  }, [resolvedDraftId, draftLinesByDraftId]);

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

  const reservedByOther = pool.filter((w) => w.status === "Reserved" && w.reservedByDraftId !== resolvedDraftId)
    .length;
  const invoicedCount = pool.filter((w) => w.status === "Invoiced").length;

  const selectedSourceIds = React.useMemo(() => new Set(lines.map((l) => l.sourceId)), [lines]);
  const workById = React.useMemo(() => new Map(billableWork.map((w) => [w.id, w] as const)), [billableWork]);
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
    if (!canAddToDraft(item, resolvedDraftId)) return;
    if (lines.some((l) => l.sourceId === item.id)) return;
    const id = `dl_${Math.random().toString(16).slice(2)}`;
    setLines((prev) => [
      ...prev,
      { id, sourceId: item.id, description: item.description, amount: computeWorkAmount(item), currency: item.currency }
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
          <h1>Σύνθεση Προσχεδίου Τιμολογίου</h1>
          <div className="row" style={{ marginTop: 8, flexWrap: "wrap", gap: 8 }}>
            <Chip tone="neutral">1) Επιλογή γραμμών</Chip>
            <Chip tone="neutral">2) Έλεγχος προσχεδίου</Chip>
            <Chip tone="neutral">3) Υποβολή για έκδοση</Chip>
          </div>
          {draftMeta ? (
            <div className="row" style={{ marginTop: 10 }}>
              <Chip tone="neutral">{`Υπεύθυνος: ${draftMeta.owner}`}</Chip>
              <Chip tone={draftMeta.status === "Ready to Issue" ? "success" : draftMeta.status === "Stale" ? "warning" : "neutral"}>
                {draftMeta.status}
              </Chip>
              {isStale ? <Chip tone="warning">{`${staleDays} ημ. παρωχημένο`}</Chip> : null}
              <Chip tone="neutral">{`${draftMeta.reservedLines} δεσμεύσεις`}</Chip>
            </div>
          ) : null}
        </div>
        <div className="row">
          <Link className="btn" to="/finance/revenue/drafts">
            Πίσω στα Πρόχειρα
          </Link>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <Card
          title="Μη Τιμολογημένη Εργασία"
          right={
            <div className="row">
              <Chip tone="success">{availableCount} διαθέσιμα</Chip>
              <Chip tone="warning">{reservedByOther} δεσμευμένα αλλού</Chip>
              <Chip tone="neutral">{invoicedCount} τιμολογημένα</Chip>
            </div>
          }
        >
          <div className="filters" style={{ marginBottom: 12 }}>
            <div className="field" style={{ minWidth: 200 }}>
              <label>Πελάτης</label>
              <select className="select" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                {Array.from(new Set(billableWork.map((w) => w.client))).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ minWidth: 200 }}>
              <label>Έργο</label>
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
              <label>Αναζήτηση</label>
              <input
                className="input"
                placeholder="id, περιγραφή…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <div style={{ overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 }}>
              {pool.length === 0 ? (
                <div className="muted" style={{ padding: 16 }}>
                  Δεν υπάρχουν διαθέσιμες εγγραφές για αυτή την επιλογή. Αλλάξτε πελάτη/έργο ή καθαρίστε την αναζήτηση.
                </div>
              ) : null}

              {pool.map((w) => {
                const isSelected = selectedSourceIds.has(w.id);
                const displayStatus: BillableWorkItem["status"] | "Reserved" = isSelected ? "Reserved" : w.status;
                const reservedElsewhere =
                  w.status === "Reserved" && !!w.reservedByDraftId && w.reservedByDraftId !== resolvedDraftId;
                const invoiced = w.status === "Invoiced" && !!w.invoicedByInvoiceId;
                const available = w.status === "Available";

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
                        <div className="row" style={{ gap: 8 }}>
                          <Chip tone={toneForBillingType(w.billingType)}>
                            {labelForBillingType(w.billingType)}
                          </Chip>
                          <Chip tone={toneForWorkStatus(displayStatus)}>
                            {isSelected ? "Στο πρόχειρο" : labelForWorkStatus(displayStatus as BillableWorkItem["status"])}
                          </Chip>
                        </div>
                      </div>

                      <div style={{ marginTop: 6, fontSize: 12 }} className="muted">
                        {w.client} · {w.project ?? "—"} · {w.date}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>{w.description}</div>
                      {w.billingType === "Hourly" ? (
                        <div style={{ marginTop: 6, fontSize: 12 }} className="muted">
                          {(w.hours ?? 0).toFixed(2)}h × {formatCurrency(w.rate ?? 0, w.currency)} /h
                        </div>
                      ) : null}
                      {reservedElsewhere ? (
                        <div style={{ marginTop: 6, fontSize: 12 }} className="muted">
                          Δεσμευμένο στο {w.reservedByDraftId}
                        </div>
                      ) : invoiced ? (
                        <div style={{ marginTop: 6, fontSize: 12 }} className="muted">
                          Τιμολογήθηκε στο {w.invoicedByInvoiceId}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <div className="num" style={{ fontWeight: 650 }}>
                        {formatCurrency(computeWorkAmount(w), w.currency)}
                      </div>
                      {available ? (
                        <button className="btn primary btn--sm" onClick={() => add(w)}>
                          Προσθήκη
                        </button>
                      ) : isSelected ? (
                        <button className="btn btn--sm" disabled title="Ήδη στο πρόχειρο">
                          Προστέθηκε
                        </button>
                      ) : reservedElsewhere ? (
                        <Link className="btn btn--sm" to={`/finance/revenue/drafts/${w.reservedByDraftId}/builder`}>
                          Άνοιγμα δεσμευμένου προσχεδίου
                        </Link>
                      ) : invoiced ? (
                        <Link className="btn btn--sm" to={`/finance/revenue/invoices/${w.invoicedByInvoiceId}`}>
                          Προβολή τιμολογίου
                        </Link>
                      ) : (
                        <button className="btn btn--sm" disabled>
                          Μη διαθέσιμο
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <Card
          title="Προσχέδιο Τιμολογίου"
          right={
            <div className="row" style={{ gap: 8 }}>
              <Chip tone="neutral">{lines.length} γραμμές</Chip>
              <Chip tone="neutral">{formatCurrency(total, currency)}</Chip>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Empty state */}
            {lines.length === 0 ? (
              <div className="card" style={{ padding: 12, background: "var(--c-surface-2)" }}>
                <div style={{ fontWeight: 650 }}>Ξεκινήστε από αριστερά</div>
                <div className="muted" style={{ marginTop: 6 }}>
                  Επιλέξτε διαθέσιμη μη τιμολογημένη εργασία και πατήστε <strong>Προσθήκη</strong>. Οι γραμμές θα εμφανιστούν
                  εδώ για επεξεργασία και έλεγχο.
                </div>
              </div>
            ) : null}

            {/* Single compact policy (no repetition) */}
            <div className="card" style={{ padding: 12, background: "var(--c-surface-2)" }}>
              <div className="muted" style={{ fontSize: 12 }}>Κανόνας αποφυγής διπλοτιμολόγησης</div>
              <div style={{ marginTop: 6 }}>
                Δεν μπορείτε να προσθέσετε εργασία που είναι <strong>δεσμευμένη αλλού</strong> ή <strong>ήδη τιμολογημένη</strong>.
                Ό,τι βρίσκεται ήδη στο πρόχειρο εμφανίζεται ως <strong>Στο πρόχειρο</strong>.
              </div>
            </div>

            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Γραμμές Προσχεδίου</div>
              <div style={{ overflow: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Πηγή</th>
                      <th>Τύπος</th>
                      <th>Περιγραφή</th>
                      <th className="num">Ποσό</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l) => (
                      <tr key={l.id}>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{l.sourceId}</td>
                        <td className="muted">
                          {(() => {
                            const w = workById.get(l.sourceId);
                            if (!w) return "—";
                            return labelForBillingType(w.billingType);
                          })()}
                        </td>
                        <td>
                          <input
                            className="input"
                            style={{ width: "100%" }}
                            value={l.description}
                            onChange={(e) => updateLineDescription(l.id, e.target.value)}
                            aria-label="Περιγραφή γραμμής"
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
                            aria-label="Ποσό γραμμής"
                          />
                        </td>
                        <td className="num">
                          <button className="btn btn--sm" onClick={() => remove(l.sourceId)}>
                            Αφαίρεση
                          </button>
                        </td>
                      </tr>
                    ))}
                    {lines.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="muted" style={{ padding: 16 }}>
                          Δεν υπάρχουν γραμμές ακόμα.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="divider" />

            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Σύνολα και Όροι</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div className="muted" style={{ fontSize: 12 }}>Υποσύνολο</div>
                  <div style={{ fontWeight: 650, fontSize: 16 }}>{formatCurrency(total, currency)}</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 12 }}>Φόροι</div>
                  <div className="muted">Δεν υποστηρίζεται στο v1 (prototype).</div>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div className="muted" style={{ fontSize: 12 }}>Σύνολο</div>
                  <div style={{ fontWeight: 650, fontSize: 16 }}>{formatCurrency(total, currency)}</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 12 }}>Όροι πληρωμής</div>
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
                    Προεπισκόπηση λήξης: {dueDatePreview}
                  </div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 12 }}>Σημείωμα (εσωτερικό)</div>
                  <textarea
                    className="input"
                    style={{ height: 90, paddingTop: 8 }}
                    placeholder="Π.χ. παρατηρήσεις, οδηγίες έκδοσης…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="row" style={{ justifyContent: "space-between", marginTop: 4 }}>
              <button className="btn" disabled={lines.length === 0} onClick={() => setConfirmDiscardOpen(true)}>
                Απόρριψη αλλαγών
              </button>
              <div className="row">
                <button className="btn" disabled={lines.length === 0} onClick={() => setConfirmSaveOpen(true)}>
                  Αποθήκευση Προσχεδίου
                </button>
                <button className="btn primary" disabled={lines.length === 0} onClick={() => setReviewOpen(true)}>
                  Έλεγχος Προσχεδίου
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <SidePanel
        open={reviewOpen}
        title="Έλεγχος Προσχεδίου"
        onClose={() => setReviewOpen(false)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <Chip tone="neutral">{`${lines.length} γραμμές`}</Chip>
            <Chip tone="neutral">{formatCurrency(total, currency)}</Chip>
          </div>

          {isStale ? (
            <div className="card" style={{ padding: 12, background: "var(--c-warning-50)" }}>
              <div style={{ fontWeight: 650, color: "#92400e" }}>Παρωχημένο πρόχειρο</div>
              <div className="muted" style={{ marginTop: 4 }}>
                Αυτό το πρόχειρο είναι παρωχημένο για {staleDays} ημέρες. Ελέγξτε τις γραμμές πριν την υποβολή.
              </div>
            </div>
          ) : null}

          <div>
            <div className="muted" style={{ fontSize: 12 }}>Όροι πληρωμής</div>
            <div style={{ fontWeight: 650 }}>{dueTerms}</div>
            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
              Προεπισκόπηση λήξης: {dueDatePreview}
            </div>
          </div>

          <div>
            <div className="muted" style={{ fontSize: 12 }}>Γραμμές (προεπισκόπηση)</div>
            <div style={{ overflow: "auto", marginTop: 8 }}>
              <table className="table" style={{ marginBottom: 0 }}>
                <thead>
                  <tr>
                    <th>Πηγή</th>
                    <th>Περιγραφή</th>
                    <th className="num">Ποσό</th>
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
                        Κενό πρόχειρο. Προσθέστε μη τιμολογημένη εργασία πρώτα.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div className="muted" style={{ fontSize: 12 }}>Σημείωμα (εσωτερικό)</div>
            <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{notes ? notes : <span className="muted">—</span>}</div>
          </div>

          <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
            <button className="btn" onClick={() => setReviewOpen(false)}>
              Πίσω στην επεξεργασία
            </button>
            <button
              className="btn primary"
              disabled={lines.length === 0 || !perms.canIssueInvoice}
              title={!perms.canIssueInvoice ? "Δεν έχετε δικαίωμα έκδοσης." : undefined}
              onClick={() => {
                if (!draftMeta) return;
                // Save current work into prototype state before issuing.
                upsertDraft({
                  ...draftMeta,
                  client: selectedClient,
                  project: selectedProject || undefined,
                  updatedAt: new Date().toISOString()
                });
                setDraftLines(resolvedDraftId, lines);
                const invId = issueDraft(resolvedDraftId, {
                  client: selectedClient,
                  project: selectedProject || undefined,
                  owner: draftMeta.owner
                });
                if (invId) navigate(`/finance/revenue/invoices/${encodeURIComponent(invId)}`);
              }}
            >
              Υποβολή για Έκδοση
            </button>
          </div>
        </div>
      </SidePanel>

      <ConfirmDialog
        open={confirmDiscardOpen}
        title="Απόρριψη αλλαγών"
        description={`Prototype: discarding will clear ${lines.length} selected line(s) and release reservations in this UI.`}
        confirmLabel="Απόρριψη"
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
        title="Αποθήκευση Προσχεδίου"
        description="Prototype: αποθήκευση στο τοπικό state (χωρίς backend)."
        confirmLabel="Αποθήκευση"
        tone="neutral"
        onCancel={() => setConfirmSaveOpen(false)}
        onConfirm={() => {
          setConfirmSaveOpen(false);
          setReviewOpen(false);
          if (!draftMeta) return;
          upsertDraft({
            ...draftMeta,
            client: selectedClient,
            project: selectedProject || undefined,
            updatedAt: new Date().toISOString()
          });
          setDraftLines(resolvedDraftId, lines);
        }}
      />
    </>
  );
}

