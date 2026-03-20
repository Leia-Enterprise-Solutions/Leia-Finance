import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { SidePanel } from "../../ui/SidePanel";
import { ActionButton } from "../../ui/ActionButton";
import { FiltersBar } from "../../ui/FiltersBar";
import type { CollectionSignal, ReceivableWorkItem } from "../../domain/types";
import { receivables as allReceivables } from "../../mock/data";
import { formatCurrency, daysBetween } from "../../domain/format";
import { getEnumParam, getStringParam } from "../../router/query";
import { useFinancePrototypeState } from "../../state/FinancePrototypeState";

function toneForSignal(s: CollectionSignal) {
  if (s === "Overdue") return "danger";
  if (s === "Due Soon") return "warning";
  return "neutral";
}

export function CollectionsPage() {
  const navigate = useNavigate();
  const loc = useLocation();
  const params = React.useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const initialSignal = getEnumParam<CollectionSignal>(
    params,
    "signal",
    ["Not Due", "Due Soon", "Overdue"] as const
  );
  const initialQ = getStringParam(params, "q");

  const [signal, setSignal] = React.useState<CollectionSignal | "All">(initialSignal ?? "All");
  const [q, setQ] = React.useState(initialQ ?? "");
  const [selected, setSelected] = React.useState<ReceivableWorkItem | null>(null);

  const { getLastCollectionNote, addCollectionNote } = useFinancePrototypeState();
  const [noteDraft, setNoteDraft] = React.useState("");
  const [noteEditorOpen, setNoteEditorOpen] = React.useState(false);

  React.useEffect(() => {
    setNoteEditorOpen(false);
    setNoteDraft("");
  }, [selected?.invoiceId]);

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (signal === "All") url.searchParams.delete("signal");
    else url.searchParams.set("signal", signal);
    if (!q.trim()) url.searchParams.delete("q");
    else url.searchParams.set("q", q.trim());
    navigate(`${loc.pathname}?${url.searchParams.toString()}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal, q]);

  const filtered = allReceivables.filter((r) => {
    if (signal !== "All" && r.signal !== signal) return false;
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return r.invoiceNumber.toLowerCase().includes(needle) || r.client.toLowerCase().includes(needle);
  });

  const now = new Date();
  const total = filtered.length;
  const overdue = filtered.filter((r) => r.signal === "Overdue").length;
  const dueSoon = filtered.filter((r) => r.signal === "Due Soon").length;
  const outstanding = filtered.reduce((a, r) => a + r.outstanding, 0);

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Οφειλές / Απαιτήσεις</h1>
          <p>Λίστα εργασιών για ανοικτές απαιτήσεις: σήματα, follow-ups και καταχώρηση αποπληρωμής.</p>
        </div>
        <div className="row">
          <ActionButton
            variant="primary"
            disabled
            disabledReason="Prototype: η εισαγωγή σημείωσης οφειλής δεν είναι διαθέσιμη στο v1."
          >
            Προσθήκη σημείωσης
          </ActionButton>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi">
          <div className="label">
            <span>Υπόλοιπο</span>
          </div>
          <div className="value">{formatCurrency(outstanding)}</div>
          <div className="sub">{total} εγγραφές</div>
        </div>
        <div className="kpi" role="button" tabIndex={0} onClick={() => setSignal("Overdue")}>
          <div className="label">
            <span>Ληξιπρόθεσμα</span>
            <span className="faint">↗</span>
          </div>
          <div className="value">{overdue}</div>
          <div className="sub">σε καθυστέρηση</div>
        </div>
        <div className="kpi" role="button" tabIndex={0} onClick={() => setSignal("Due Soon")}>
          <div className="label">
            <span>Λήγουν σύντομα</span>
            <span className="faint">↗</span>
          </div>
          <div className="value">{dueSoon}</div>
          <div className="sub">προτεραιότητα follow-up</div>
        </div>
      </div>

      <Card title="Φίλτρα">
        <FiltersBar
          moreLabel="Περισσότερα φίλτρα"
          right={
            <div className="row" style={{ gap: 8 }}>
              {signal !== "All" ? <Chip tone={toneForSignal(signal)}>Ενεργό: {signal}</Chip> : null}
              <span className="muted" style={{ fontSize: 12 }}>{total} αποτελέσματα</span>
            </div>
          }
        >
          <div className="field" style={{ minWidth: 320 }}>
            <label>Αναζήτηση</label>
            <input
              className="input"
              placeholder="Αναζήτηση: αρ. τιμολογίου ή πελάτης…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="field" style={{ minWidth: 220 }}>
            <label>Σήμα</label>
            <select className="select" value={signal} onChange={(e) => setSignal(e.target.value as CollectionSignal | "All")}>
              <option value="All">Όλα</option>
              <option value="Not Due">Όχι ληξιπρόθεσμο</option>
              <option value="Due Soon">Λήγει σύντομα</option>
              <option value="Overdue">Ληξιπρόθεσμο</option>
            </select>
          </div>
        </FiltersBar>
      </Card>

      <div style={{ height: 14 }} />

      <Card title="Λίστα οφειλών">
        <div style={{ overflow: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Τιμολόγιο</th>
                <th>Πελάτης</th>
                <th>Υπεύθυνος</th>
                <th>Λήξη</th>
                <th className="num">Days overdue</th>
                <th className="num">Υπόλοιπο</th>
                <th>Σήμα</th>
                <th>Expected payment date</th>
                <th>Last note</th>
                <th>Επόμενη ενέργεια</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const daysOver = now > new Date(r.dueDate) ? daysBetween(now, new Date(r.dueDate)) : 0;
                const last = getLastCollectionNote(r.invoiceId);
                const lastDate = last ? new Date(last.at).toISOString().slice(0, 10) : "—";
                const lastSnippet = last ? (last.text.length > 44 ? `${last.text.slice(0, 44)}…` : last.text) : "—";
                return (
                  <tr key={r.invoiceId} onClick={() => setSelected(r)} style={{ cursor: "pointer" }}>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.invoiceNumber}</td>
                    <td>{r.client}</td>
                    <td className="muted">{r.owner}</td>
                    <td>
                      <span>{r.dueDate}</span>
                    </td>
                    <td className="num">{r.signal === "Overdue" ? `${daysOver}` : "—"}</td>
                    <td className="num">{formatCurrency(r.outstanding, r.currency)}</td>
                    <td>
                      <Chip tone={toneForSignal(r.signal)}>{r.signal}</Chip>
                    </td>
                    <td className="muted">—</td>
                    <td className="muted" style={{ maxWidth: 280 }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{lastDate}</div>
                      <div style={{ marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {lastSnippet}
                      </div>
                    </td>
                    <td className="muted">{r.nextAction ?? "—"}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="muted" style={{ padding: 16 }}>
                    Δεν υπάρχουν οφειλές σε αυτή την προβολή. Αλλάξτε φίλτρο σήματος ή εύρος ημερομηνιών.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <SidePanel
        open={!!selected}
        title={selected ? `${selected.invoiceNumber} • ${selected.client}` : "Οφειλή"}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <Chip tone={toneForSignal(selected.signal)}>{selected.signal}</Chip>
              <Chip tone="neutral">{selected.owner}</Chip>
            </div>
            <div className="divider" />
            {selected.signal === "Overdue" ? (
              <div className="card" style={{ padding: 12, background: "var(--c-danger-50)" }}>
                <div style={{ fontWeight: 650, color: "#991b1b" }}>Ληξιπρόθεσμη οφειλή</div>
                <div className="muted" style={{ marginTop: 4 }}>
                  Αυτή η οφειλή χρειάζεται follow-up. Υψηλή προτεραιότητα στο Οφειλές.
                </div>
              </div>
            ) : null}
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Υπόλοιπο
              </div>
              <div style={{ fontWeight: 650, fontSize: 16 }}>
                {formatCurrency(selected.outstanding, selected.currency)}
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Ημ/νία λήξης
              </div>
              <div>{selected.dueDate}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Expected payment date
              </div>
              <div>—</div>
            </div>
            <div className="card" style={{ padding: 12, background: "var(--c-surface-2)" }}>
              <div className="muted" style={{ fontSize: 12 }}>
                Τελευταία σημείωση οφειλής
              </div>
              {(() => {
                const last = getLastCollectionNote(selected.invoiceId);
                const lastDate = last ? new Date(last.at).toISOString().slice(0, 10) : null;
                return (
                  <>
                    <div style={{ marginTop: 6 }}>
                      {last?.text ? last.text : selected.nextAction ?? "Προσθήκη σημείωσης…"}
                    </div>
                    <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                      Ημ/νία τελευταίας σημείωσης: {lastDate ?? "—"}
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="row">
              <button
                className="btn"
                onClick={() => {
                  setNoteDraft("");
                  setNoteEditorOpen(true);
                }}
              >
                Προσθήκη σημείωσης
              </button>
              <button className="btn primary" onClick={() => navigate(`/finance/revenue/invoices/${selected.invoiceId}`)}>
                Open full invoice detail
              </button>
            </div>

            {noteEditorOpen ? (
              <div className="card" style={{ padding: 12, background: "var(--c-surface-2)" }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Σημείωση
                </div>
                <textarea
                  className="input"
                  style={{ height: 90, paddingTop: 8, marginTop: 8 }}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="e.g. Call scheduled, payment confirmation received, expected date…"
                />
                <div className="row" style={{ justifyContent: "space-between", marginTop: 10 }}>
                  <button
                    className="btn"
                    onClick={() => {
                      setNoteEditorOpen(false);
                      setNoteDraft("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn primary"
                    onClick={() => {
                      addCollectionNote(selected.invoiceId, noteDraft, selected.owner);
                      setNoteEditorOpen(false);
                      setNoteDraft("");
                    }}
                    disabled={!noteDraft.trim()}
                  >
                    Αποθήκευση σημείωσης
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </SidePanel>
    </>
  );
}

