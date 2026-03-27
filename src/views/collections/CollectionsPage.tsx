import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { SidePanel } from "../../ui/SidePanel";
import { ActionButton } from "../../ui/ActionButton";
import { Popover } from "../../ui/Popover";
import type { CollectionSignal, ReceivableWorkItem } from "../../domain/types";
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
  const [fromDue, setFromDue] = React.useState(getStringParam(params, "fromDue") ?? "");
  const [toDue, setToDue] = React.useState(getStringParam(params, "toDue") ?? "");
  const [selected, setSelected] = React.useState<ReceivableWorkItem | null>(null);

  const { getLastCollectionNote, addCollectionNote, receivables: allReceivables } = useFinancePrototypeState();
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
    if (!fromDue.trim()) url.searchParams.delete("fromDue");
    else url.searchParams.set("fromDue", fromDue.trim());
    if (!toDue.trim()) url.searchParams.delete("toDue");
    else url.searchParams.set("toDue", toDue.trim());
    navigate(`${loc.pathname}?${url.searchParams.toString()}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal, q, fromDue, toDue]);

  const filtered = allReceivables.filter((r) => {
    if (signal !== "All" && r.signal !== signal) return false;
    if (fromDue.trim() && r.dueDate < fromDue.trim()) return false;
    if (toDue.trim() && r.dueDate > toDue.trim()) return false;
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
          <h1>Απαιτήσεις / Εισπράξεις</h1>
          <p>Λίστα εργασιών follow-up για ανοικτές απαιτήσεις: λειτουργικά σήματα, follow-ups και καταχώρηση σημείωσης.</p>
        </div>
        <div className="row">
          <ActionButton
            variant="primary"
            disabled={!selected}
            disabledReason={!selected ? "Επιλέξτε μια απαίτηση από τη λίστα για καταχώρηση σημείωσης." : undefined}
            onClick={() => {
              if (!selected) return;
              setNoteDraft("");
              setNoteEditorOpen(true);
            }}
          >
            Καταχώρηση Σημείωσης
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

      <div className="invoice-filters-bar">
        <div className="invoice-filters-row">
          <div className="invoice-filters-main">
            <div className="field invoice-filter-field invoice-filter-field--wide">
              <label>Αναζήτηση</label>
              <input
                className="input"
                placeholder="Αναζήτηση: αρ. τιμολογίου ή πελάτης…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="field invoice-filter-field">
              <label>Σήμα</label>
              <select className="select" value={signal} onChange={(e) => setSignal(e.target.value as CollectionSignal | "All")}>
                <option value="All">Όλα</option>
                <option value="Not Due">Όχι ληξιπρόθεσμο</option>
                <option value="Due Soon">Λήγει σύντομα</option>
                <option value="Overdue">Ληξιπρόθεσμο</option>
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
                    <label>Λήξη από</label>
                    <input className="input" type="date" value={fromDue} onChange={(e) => setFromDue(e.target.value)} />
                  </div>
                </div>
                <div className="filters-more__item">
                  <div className="field invoice-filter-field">
                    <label>Λήξη έως</label>
                    <input className="input" type="date" value={toDue} onChange={(e) => setToDue(e.target.value)} />
                  </div>
                </div>
              </div>
            </Popover>
            <button
              className="btn ghost btn--sm"
              onClick={() => {
                setSignal("All");
                setQ("");
                setFromDue("");
                setToDue("");
              }}
              title="Εκκαθάριση φίλτρων"
            >
              <span>Εκκαθάριση</span>
            </button>
          </div>
          <div className="invoice-filters-right">
            <div className="row" style={{ gap: 8 }}>
              {signal !== "All" ? <Chip tone={toneForSignal(signal)}>Ενεργό: {signal}</Chip> : null}
              <span className="muted" style={{ fontSize: 12 }}>
                {total} αποτελέσματα
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="finance-spacer" />

      <Card title="Λίστα απαιτήσεων">
        <div className="finance-table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Τιμολόγιο</th>
                <th>Πελάτης</th>
                <th>Υπεύθυνος</th>
                <th>Λήξη</th>
                <th className="num">Ημέρες καθυστέρησης</th>
                <th className="num">Υπόλοιπο</th>
                <th>Σήμα</th>
                <th>Αναμενόμενη ημ/νία</th>
                <th>Τελευταία σημείωση</th>
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
                  <tr key={r.invoiceId} onClick={() => setSelected(r)} className="finance-table-clickrow">
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
                    Δεν υπάρχουν απαιτήσεις σε αυτή την προβολή. Αλλάξτε φίλτρο σήματος ή εύρος ημερομηνιών λήξης.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <SidePanel
        open={!!selected}
        title={selected ? `${selected.invoiceNumber} • ${selected.client}` : "Απαίτηση"}
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
              <div className="finance-callout" data-tone="danger">
                <div className="finance-callout__title">Ληξιπρόθεσμη απαίτηση</div>
                <div className="finance-callout__body">
                  Αυτή η απαίτηση χρειάζεται follow-up. Υψηλή προτεραιότητα στις Απαιτήσεις.
                </div>
              </div>
            ) : null}
            <div>
              <div className="finance-kv__label">
                Υπόλοιπο
              </div>
              <div className="finance-kv__value finance-kv__value--strong" style={{ fontSize: 16 }}>
                {formatCurrency(selected.outstanding, selected.currency)}
              </div>
            </div>
            <div>
              <div className="finance-kv__label">
                Ημ/νία λήξης
              </div>
              <div>{selected.dueDate}</div>
            </div>
            <div>
              <div className="finance-kv__label">
                Expected payment date
              </div>
              <div>—</div>
            </div>
            <div className="finance-box">
              <div className="finance-kv__label">
                Τελευταία σημείωση απαίτησης
              </div>
              {(() => {
                const last = getLastCollectionNote(selected.invoiceId);
                const lastDate = last ? new Date(last.at).toISOString().slice(0, 10) : null;
                return (
                  <>
                    <div style={{ marginTop: 6 }}>
                      {last?.text ? last.text : selected.nextAction ?? "Προσθήκη σημείωσης…"}
                    </div>
                    <div className="finance-meta" style={{ marginTop: 8 }}>
                      Ημ/νία τελευταίας σημείωσης: {lastDate ?? "—"}
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <button
                className="btn ghost btn--sm"
                onClick={() => navigate(`/finance/revenue/invoices/${selected.invoiceId}`)}
                title="Προβολή τιμολογίου"
              >
                Προβολή τιμολογίου
              </button>
              <ActionButton
                variant="primary"
                onClick={() => {
                  setNoteDraft("");
                  setNoteEditorOpen(true);
                }}
              >
                Καταχώρηση Σημείωσης
              </ActionButton>
            </div>

            {noteEditorOpen ? (
              <div className="finance-box">
                <div className="finance-kv__label">
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

