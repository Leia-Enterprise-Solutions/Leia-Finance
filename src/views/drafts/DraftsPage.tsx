import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { SidePanel } from "../../ui/SidePanel";
import type { InvoiceDraft } from "../../domain/types";
import { formatCurrency } from "../../domain/format";
import { getEnumParam, getStringParam } from "../../router/query";
import { useFinancePrototypeState } from "../../state/FinancePrototypeState";

function toneForDraftStatus(s: InvoiceDraft["status"]) {
  if (s === "Ready to Issue") return "success";
  if (s === "Stale") return "warning";
  if (s === "Issued") return "neutral";
  return "neutral";
}

function labelForDraftStatus(s: InvoiceDraft["status"]) {
  if (s === "In Progress") return "Σε εξέλιξη";
  if (s === "Stale") return "Παρωχημένο";
  if (s === "Ready to Issue") return "Έτοιμο για έκδοση";
  if (s === "Issued") return "Εκδόθηκε";
  return s;
}

export function DraftsPage() {
  const navigate = useNavigate();
  const loc = useLocation();
  const { invoiceDrafts: allDrafts, draftLinesByDraftId, discardDraft } = useFinancePrototypeState();
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
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);

  function staleAgeDays(d: InvoiceDraft) {
    const updated = new Date(d.updatedAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - updated) / (1000 * 60 * 60 * 24)));
  }

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
          <h1>Πρόχειρα Τιμολογίου</h1>
          <p>Διαχείριση προσχεδίων: σε εξέλιξη, παρωχημένα, έτοιμα για έκδοση και ορατότητα δεσμευμένων γραμμών.</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => navigate("/finance/revenue/drafts/builder")}>
            Συνέχεια Προσχεδίου
          </button>
          <button className="btn primary" onClick={() => navigate("/finance/revenue/drafts/builder")}>
            Νέο Πρόχειρο Τιμολογίου
          </button>
        </div>
      </div>

      <Card title="Φίλτρα">
        <div className="filters">
          <div className="field" style={{ minWidth: 240 }}>
            <label>Αναζήτηση</label>
            <input
              className="input"
              placeholder="Πελάτης, έργο, id προσχεδίου…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="field" style={{ minWidth: 200 }}>
            <label>Κατάσταση</label>
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value as InvoiceDraft["status"] | "All")}
            >
              <option value="All">Όλα</option>
              <option value="In Progress">Σε εξέλιξη</option>
              <option value="Stale">Παρωχημένο</option>
              <option value="Ready to Issue">Έτοιμο για έκδοση</option>
            </select>
          </div>
          <Chip tone="neutral">{filtered.length} προσχέδια</Chip>
          <Chip tone="warning">{filtered.filter((d) => d.status === "Stale").length} παρωχημένα</Chip>
          <Chip tone="success">
            {filtered.filter((d) => d.status === "Ready to Issue").length} έτοιμα
          </Chip>
        </div>
      </Card>

      <div style={{ height: 14 }} />

      <Card title="Λίστα προσχεδίων">
        <div style={{ overflow: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Πρόχειρο</th>
                <th>Πελάτης</th>
                <th>Έργο</th>
                <th>Υπεύθυνος</th>
                <th>Ενημέρωση</th>
                <th className="num">Ηλικία</th>
                <th className="num">Γραμμές</th>
                <th className="num">Σύνολο</th>
                <th>Έλεγχος</th>
                <th className="num">Δεσμεύσεις</th>
                <th>Κατάσταση</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} onClick={() => setSelected(d)} style={{ cursor: "pointer" }}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{d.id}</td>
                  <td>{d.client}</td>
                  <td className="muted">{d.project ?? "—"}</td>
                  <td>{d.owner}</td>
                  <td className="muted">{new Date(d.updatedAt).toISOString().slice(0, 10)}</td>
                  <td className="num">{staleAgeDays(d)}d</td>
                  <td className="num">{draftLinesByDraftId[d.id]?.length ?? 0}</td>
                  <td className="num">{formatCurrency(d.draftTotal, d.currency)}</td>
                  <td>
                    <Chip tone={d.status === "Stale" ? "warning" : "neutral"}>
                      {d.status === "Stale" ? "Χρειάζεται έλεγχο" : "—"}
                    </Chip>
                  </td>
                  <td className="num">{d.reservedLines}</td>
                  <td>
                    <Chip tone={toneForDraftStatus(d.status)}>{labelForDraftStatus(d.status)}</Chip>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="muted" style={{ padding: 16 }}>
                    Δεν βρέθηκαν πρόχειρα. Δοκιμάστε να καθαρίσετε φίλτρα ή δημιουργήστε νέο πρόχειρο.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <SidePanel
        open={!!selected}
        title={selected ? `Πρόχειρο ${selected.id}` : "Πρόχειρο"}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <Chip tone={toneForDraftStatus(selected.status)}>{labelForDraftStatus(selected.status)}</Chip>
              <Chip tone="neutral">{`Reserving ${selected.reservedLines} lines`}</Chip>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              Updated: {new Date(selected.updatedAt).toISOString().slice(0, 10)} · Owner: {selected.owner}
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
                  This draft is stale for {staleAgeDays(selected)} days. Review reserved lines and either resume in the
                  builder or discard to release them.
                </div>
              </div>
            ) : null}

            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Selected lines
              </div>
              <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
                <Chip tone="neutral">{draftLinesByDraftId[selected.id]?.length ?? 0} lines</Chip>
                <span className="muted" style={{ fontSize: 12 }}>
                  Preview (top 10)
                </span>
              </div>
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
                    {(draftLinesByDraftId[selected.id] ?? []).slice(0, 10).map((l) => (
                      <tr key={l.id}>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{l.sourceId}</td>
                        <td>{l.description}</td>
                        <td className="num">{formatCurrency(l.amount, l.currency)}</td>
                      </tr>
                    ))}
                    {(draftLinesByDraftId[selected.id] ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="muted" style={{ padding: 16 }}>
                          Empty draft. Discard to release reserved lines.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="row">
              <button className="btn" onClick={() => navigate(`/finance/revenue/drafts/${selected.id}/builder`)}>
                Άνοιγμα για Έκδοση
              </button>
              <button className="btn" onClick={() => setConfirmDiscard(true)}>
                Απόρριψη και Αποδέσμευση
              </button>
            </div>
          </div>
        ) : null}
      </SidePanel>

      <ConfirmDialog
        open={confirmDiscard}
        title="Απόρριψη προσχεδίου"
        description={
          selected
            ? `Prototype confirmation: discarding draft ${selected.id} will release reserved lines (${selected.reservedLines}).`
            : undefined
        }
        confirmLabel="Απόρριψη"
        tone="danger"
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false);
          if (selected) discardDraft(selected.id);
          setSelected(null);
        }}
      />
    </>
  );
}

