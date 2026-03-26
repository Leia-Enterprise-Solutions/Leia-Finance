import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { SidePanel } from "../../ui/SidePanel";
import { ActionButton } from "../../ui/ActionButton";
import { FiltersBar } from "../../ui/FiltersBar";
import type { Invoice, InvoiceStatus, TransmissionStatus } from "../../domain/types";
import { formatCurrency, daysBetween } from "../../domain/format";
import { getEnumParam, getStringParam } from "../../router/query";
import { useFinancePrototypeState } from "../../state/FinancePrototypeState";

function toneForInvoiceStatus(s: InvoiceStatus) {
  if (s === "Paid") return "success";
  if (s === "Overdue") return "danger";
  if (s === "Partially Paid") return "warning";
  return "neutral";
}

function toneForTransmission(s: TransmissionStatus) {
  if (s === "Rejected") return "danger";
  if (s === "Pending") return "warning";
  return "neutral";
}

export function InvoicesPage() {
  const navigate = useNavigate();
  const loc = useLocation();
  const { invoices: allInvoices, receivables, addCollectionNote } = useFinancePrototypeState();
  const params = React.useMemo(() => new URLSearchParams(loc.search), [loc.search]);

  const initialStatus = getEnumParam<InvoiceStatus>(
    params,
    "status",
    ["Draft", "Issued", "Partially Paid", "Paid", "Overdue", "Cancelled"] as const
  );
  const initialQ = getStringParam(params, "q");
  const initialDateField = getEnumParam<"issue" | "due">(params, "dateField", ["issue", "due"] as const);
  const initialFrom = getStringParam(params, "from");
  const initialTo = getStringParam(params, "to");

  const [status, setStatus] = React.useState<InvoiceStatus | "All">(initialStatus ?? "All");
  const [q, setQ] = React.useState(initialQ ?? "");
  const [dateField, setDateField] = React.useState<"issue" | "due">(initialDateField ?? "issue");
  const [from, setFrom] = React.useState(initialFrom ?? "");
  const [to, setTo] = React.useState(initialTo ?? "");
  const [selected, setSelected] = React.useState<Invoice | null>(null);
  const [noteEditorOpen, setNoteEditorOpen] = React.useState(false);
  const [noteDraft, setNoteDraft] = React.useState("");

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (status === "All") url.searchParams.delete("status");
    else url.searchParams.set("status", status);
    if (!q.trim()) url.searchParams.delete("q");
    else url.searchParams.set("q", q.trim());
    url.searchParams.set("dateField", dateField);
    if (!from.trim()) url.searchParams.delete("from");
    else url.searchParams.set("from", from.trim());
    if (!to.trim()) url.searchParams.delete("to");
    else url.searchParams.set("to", to.trim());
    navigate(`${loc.pathname}?${url.searchParams.toString()}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q, dateField, from, to]);

  const selectedDateForInvoice = (i: Invoice) => (dateField === "issue" ? i.issueDate : i.dueDate);

  const filtered = allInvoices.filter((i) => {
    if (status !== "All" && i.status !== status) return false;
    const d = selectedDateForInvoice(i);
    if (from.trim() && d < from.trim()) return false;
    if (to.trim() && d > to.trim()) return false;
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return (
      i.number.toLowerCase().includes(needle) ||
      i.client.toLowerCase().includes(needle) ||
      (i.project ?? "").toLowerCase().includes(needle)
    );
  });

  const now = new Date();
  const total = filtered.length;
  const overdue = filtered.filter((i) => i.status === "Overdue").length;
  const partial = filtered.filter((i) => i.status === "Partially Paid").length;

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Τιμολόγια</h1>
          <p>Λίστα εκδοθέντων τιμολογίων: καθυστερήσεις, διαβίβαση μέσω παρόχου και πρόσβαση σε λεπτομέρειες.</p>
        </div>
        <div className="row">
          <button className="btn primary" onClick={() => navigate("/finance/revenue/drafts/builder")}>
            Νέο πρόχειρο
          </button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi">
          <div className="label">
            <span>Σύνολο</span>
          </div>
          <div className="value">{total}</div>
          <div className="sub">τιμολόγια στην προβολή</div>
        </div>
        <div className="kpi" role="button" tabIndex={0} onClick={() => setStatus("Overdue")}>
          <div className="label">
            <span>Ληξιπρόθεσμα</span>
            <span className="faint">↗</span>
          </div>
          <div className="value">{overdue}</div>
          <div className="sub">σε καθυστέρηση</div>
        </div>
        <div className="kpi" role="button" tabIndex={0} onClick={() => setStatus("Partially Paid")}>
          <div className="label">
            <span>Μερικώς εξοφλημένα</span>
            <span className="faint">↗</span>
          </div>
          <div className="value">{partial}</div>
          <div className="sub">υπόλοιπο ανοικτό</div>
        </div>
      </div>

      <Card
        title="Φίλτρα"
        right={
          <button
            className="btn"
            onClick={() => {
              setStatus("All");
              setQ("");
              setDateField("issue");
              setFrom("");
              setTo("");
            }}
          >
            Εκκαθάριση
          </button>
        }
      >
        <FiltersBar
          moreLabel="Περισσότερα φίλτρα"
          right={<span className="muted" style={{ fontSize: 12 }}>{total} αποτελέσματα</span>}
        >
          <div className="field" style={{ minWidth: 320 }}>
            <label>Αναζήτηση</label>
            <input
              className="input"
              placeholder="Αναζήτηση: αρ. τιμολογίου, πελάτης, έργο…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="field" style={{ minWidth: 220 }}>
            <label>Κατάσταση</label>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus | "All")}>
              <option value="All">Όλα</option>
              <option value="Issued">Εκδόθηκε</option>
              <option value="Partially Paid">Μερικώς εξοφλημένο</option>
              <option value="Paid">Εξοφλημένο</option>
              <option value="Overdue">Ληξιπρόθεσμο</option>
              <option value="Cancelled">Ακυρώθηκε</option>
            </select>
          </div>
          <div className="field" style={{ minWidth: 180 }}>
            <label>Ημερομηνία</label>
            <select className="select" value={dateField} onChange={(e) => setDateField(e.target.value as "issue" | "due")}>
              <option value="issue">Ημ/νία έκδοσης</option>
              <option value="due">Ημ/νία λήξης</option>
            </select>
          </div>
          <div className="field" style={{ minWidth: 180 }}>
            <label>Από</label>
            <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field" style={{ minWidth: 180 }}>
            <label>Έως</label>
            <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </FiltersBar>
      </Card>

      <div className="finance-spacer" />

      <Card title="Λίστα τιμολογίων">
        <div className="finance-table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Τιμολόγιο</th>
                <th>Πελάτης</th>
                <th>Έργο</th>
                <th>Έκδοση</th>
                <th>Λήξη</th>
                <th className="num">Ημέρες καθυστέρησης</th>
                <th className="num">Σύνολο</th>
                <th className="num">Εξοφληθέν</th>
                <th className="num">Υπόλοιπο</th>
                <th>Κατάσταση</th>
                <th>Διαβίβαση</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => {
                const outstanding = Math.max(0, i.total - i.paid);
                const daysOver = now > new Date(i.dueDate) ? daysBetween(now, new Date(i.dueDate)) : 0;
                const overdueTint = i.status === "Overdue" ? "rgba(220, 38, 38, 0.08)" : undefined;
                return (
                  <tr
                    key={i.id}
                    onClick={() => setSelected(i)}
                    className="finance-table-clickrow"
                    style={{ background: overdueTint }}
                  >
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{i.number}</td>
                    <td>{i.client}</td>
                    <td className="muted">{i.project ?? "—"}</td>
                    <td className="muted">{i.issueDate}</td>
                    <td>
                      <span>{i.dueDate}</span>
                    </td>
                    <td className="num">{i.status === "Overdue" ? `${daysOver}` : "—"}</td>
                    <td className="num">{formatCurrency(i.total, i.currency)}</td>
                    <td className="num">{formatCurrency(i.paid, i.currency)}</td>
                    <td className="num">{formatCurrency(outstanding, i.currency)}</td>
                    <td>
                      <Chip tone={toneForInvoiceStatus(i.status)}>{i.status}</Chip>
                    </td>
                    <td>
                      <Chip tone={toneForTransmission(i.transmission)}>{i.transmission}</Chip>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="muted" style={{ padding: 16 }}>
                    Δεν υπάρχουν τιμολόγια σε αυτή την προβολή. Δοκιμάστε να αλλάξετε φίλτρα ή εύρος ημερομηνιών.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <SidePanel
        open={!!selected}
        title={selected ? `${selected.number} • ${selected.client}` : "Invoice"}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          (() => {
            const receivable = receivables.find((r) => r.invoiceId === selected.id) ?? null;
            return (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <Chip tone={toneForInvoiceStatus(selected.status)}>{selected.status}</Chip>
              <Chip tone={toneForTransmission(selected.transmission)}>{selected.transmission}</Chip>
            </div>
            <div className="divider" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Total
                </div>
                <div style={{ fontWeight: 650 }}>{formatCurrency(selected.total, selected.currency)}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Paid
                </div>
                <div style={{ fontWeight: 650 }}>{formatCurrency(selected.paid, selected.currency)}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Outstanding
                </div>
                <div style={{ fontWeight: 650 }}>
                  {formatCurrency(Math.max(0, selected.total - selected.paid), selected.currency)}
                </div>
              </div>
            </div>
            <div className="divider" />
            <div className="finance-kv-grid">
              <div>
                <div className="finance-kv__label">
                  Ημ/νία έκδοσης
                </div>
                <div>{selected.issueDate}</div>
              </div>
              <div>
                <div className="finance-kv__label">
                  Ημ/νία λήξης
                </div>
                <div>{selected.dueDate}</div>
              </div>
              <div>
                <div className="finance-kv__label">
                  Υπεύθυνος
                </div>
                <div>{receivable?.owner ?? selected.owner}</div>
              </div>
              <div>
                <div className="finance-kv__label">
                  Έργο
                </div>
                <div>{selected.project ?? "—"}</div>
              </div>
            </div>
            <div className="finance-box">
              <div className="finance-kv__label">
                Collections note / last follow-up
              </div>
              <div style={{ marginTop: 6 }}>{receivable?.nextAction ?? "—"}</div>
              <div className="finance-meta" style={{ marginTop: 8 }}>
                Αναμενόμενη ημ/νία πληρωμής: — (v1: δεν μοντελοποιείται πλήρως)
              </div>
            </div>
            {selected.transmission === "Rejected" ? (
              <div className="finance-callout" data-tone="danger">
                <div className="finance-callout__title">Απόρριψη διαβίβασης</div>
                <div className="finance-callout__body">
                  Διορθώστε τα στοιχεία και επανεκδώστε / επαναστείλετε σύμφωνα με την πολιτική.
                </div>
              </div>
            ) : null}
            <div className="row">
              <button className="btn" onClick={() => navigate(`/finance/revenue/invoices/${selected.id}`)}>
                Πλήρεις λεπτομέρειες
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
              <button
                className="btn"
                onClick={() => navigate(`/finance/revenue/collections?q=${encodeURIComponent(selected.number)}`)}
              >
                Μετάβαση στις Εισπράξεις
              </button>
            </div>

            {noteEditorOpen ? (
              <div className="finance-box">
                <div className="finance-kv__label">
                  Σημείωση είσπραξης
                </div>
                <textarea
                  className="input"
                  style={{ height: 90, paddingTop: 8, marginTop: 8 }}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="π.χ. follow-up, επιβεβαίωση πληρωμής, αναμενόμενη ημερομηνία…"
                />
                <div className="row" style={{ justifyContent: "space-between", marginTop: 10 }}>
                  <button
                    className="btn"
                    onClick={() => {
                      setNoteEditorOpen(false);
                      setNoteDraft("");
                    }}
                  >
                    Ακύρωση
                  </button>
                  <button
                    className="btn primary"
                    disabled={!noteDraft.trim()}
                    onClick={() => {
                      addCollectionNote(selected.id, noteDraft, receivable?.owner ?? selected.owner);
                      setNoteEditorOpen(false);
                      setNoteDraft("");
                    }}
                  >
                    Αποθήκευση σημείωσης
                  </button>
                </div>
              </div>
            ) : null}
          </div>
            );
          })()
        ) : null}
      </SidePanel>
    </>
  );
}

