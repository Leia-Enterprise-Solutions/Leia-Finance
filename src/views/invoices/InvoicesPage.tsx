import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { SidePanel } from "../../ui/SidePanel";
import { ActionButton } from "../../ui/ActionButton";
import { Popover } from "../../ui/Popover";
import type { Invoice, InvoiceStatus, TransmissionStatus } from "../../domain/types";
import { formatCurrency, daysBetween } from "../../domain/format";
import { getEnumParam, getStringParam } from "../../router/query";
import { useFinancePrototypeState } from "../../state/FinancePrototypeState";

type SortKey =
  | "number"
  | "client"
  | "project"
  | "issueDate"
  | "dueDate"
  | "daysOver"
  | "total"
  | "paid"
  | "outstanding"
  | "status"
  | "transmission";

type SortDir = "asc" | "desc";

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
  const [sortKey, setSortKey] = React.useState<SortKey>("dueDate");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

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
  const sorted = React.useMemo(() => {
    const arr = filtered.slice();
    const cmp = (a: Invoice, b: Invoice) => {
      const daysOverA = now > new Date(a.dueDate) ? daysBetween(now, new Date(a.dueDate)) : 0;
      const daysOverB = now > new Date(b.dueDate) ? daysBetween(now, new Date(b.dueDate)) : 0;
      const outstandingA = Math.max(0, a.total - a.paid);
      const outstandingB = Math.max(0, b.total - b.paid);
      let res = 0;
      switch (sortKey) {
        case "number":
          res = a.number.localeCompare(b.number);
          break;
        case "client":
          res = a.client.localeCompare(b.client);
          break;
        case "project":
          res = (a.project ?? "").localeCompare(b.project ?? "");
          break;
        case "issueDate":
          res = a.issueDate.localeCompare(b.issueDate);
          break;
        case "dueDate":
          res = a.dueDate.localeCompare(b.dueDate);
          break;
        case "daysOver":
          res = daysOverA - daysOverB;
          break;
        case "total":
          res = a.total - b.total;
          break;
        case "paid":
          res = a.paid - b.paid;
          break;
        case "outstanding":
          res = outstandingA - outstandingB;
          break;
        case "status":
          res = a.status.localeCompare(b.status);
          break;
        case "transmission":
          res = a.transmission.localeCompare(b.transmission);
          break;
      }
      if (res === 0) return a.number.localeCompare(b.number);
      return sortDir === "asc" ? res : -res;
    };
    arr.sort(cmp);
    return arr;
  }, [filtered, now, sortDir, sortKey]);

  const onSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const header = (label: string, key: SortKey, className?: string) => (
    <th className={className}>
      <button
        type="button"
        className={`table-sort ${sortKey === key ? "table-sort--active" : ""}`}
        onClick={() => onSort(key)}
        title={`Ταξινόμηση: ${label}`}
      >
        <span>{label}</span>
        <i className={`bi ${sortKey === key ? (sortDir === "asc" ? "bi-chevron-up" : "bi-chevron-down") : "bi-chevron-expand"}`} aria-hidden="true" />
      </button>
    </th>
  );
  const total = filtered.length;
  const overdue = filtered.filter((i) => i.status === "Overdue").length;
  const partial = filtered.filter((i) => i.status === "Partially Paid").length;
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageRows = sorted.slice(pageStart, pageStart + pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [status, q, dateField, from, to]);

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visiblePageStart = Math.max(1, Math.min(safePage - 1, totalPages - 2));
  const visiblePages = [visiblePageStart, visiblePageStart + 1, visiblePageStart + 2].filter((p) => p >= 1 && p <= totalPages);

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Τιμολόγια</h1>
          <p>Λίστα εκδοθέντων τιμολογίων: καθυστερήσεις, διαβίβαση μέσω παρόχου και πρόσβαση σε λεπτομέρειες.</p>
        </div>
        <div className="row">
          <button className="btn primary" onClick={() => navigate("/finance/revenue/drafts/builder")}>
            <span className="row" style={{ gap: 8, alignItems: "center" }}>
              <i className="bi bi-plus-lg" aria-hidden="true" />
              Νέο τιμολόγιο
            </span>
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
        <div className="kpi kpi--static">
          <div className="label">
            <span>Ληξιπρόθεσμα</span>
          </div>
          <div className="value">{overdue}</div>
          <div className="sub">σε καθυστέρηση</div>
        </div>
        <div className="kpi kpi--static">
          <div className="label">
            <span>Μερικώς εξοφλημένα</span>
          </div>
          <div className="value">{partial}</div>
          <div className="sub">υπόλοιπο ανοικτό</div>
        </div>
      </div>

      <div className="invoice-filters-bar">
        <div className="invoice-filters-row">
          <div className="invoice-filters-main">
            <div className="field invoice-filter-field invoice-filter-field--wide">
              <label>Αναζήτηση</label>
              <input
                className="input"
                placeholder="Αναζήτηση: αρ. τιμολογίου, πελάτης, έργο…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="field invoice-filter-field">
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
            <div className="field invoice-filter-field">
              <label>Ημερομηνία</label>
              <select className="select" value={dateField} onChange={(e) => setDateField(e.target.value as "issue" | "due")}>
                <option value="issue">Ημ/νία έκδοσης</option>
                <option value="due">Ημ/νία λήξης</option>
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
                    <label>Από</label>
                    <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                  </div>
                </div>
                <div className="filters-more__item">
                  <div className="field invoice-filter-field">
                    <label>Έως</label>
                    <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                  </div>
                </div>
              </div>
            </Popover>
            <button
              className="btn ghost btn--sm"
              onClick={() => {
                setStatus("All");
                setQ("");
                setDateField("issue");
                setFrom("");
                setTo("");
              }}
              title="Εκκαθάριση φίλτρων"
            >
              <span>Εκκαθάριση</span>
            </button>
          </div>
          <div className="invoice-filters-right">
            <div className="invoice-pagination">
              <button className="btn ghost btn--sm" onClick={() => setPage(1)} disabled={safePage <= 1} title="Πρώτη σελίδα">
                <i className="bi bi-chevron-double-left" aria-hidden="true" />
              </button>
              <button className="btn ghost btn--sm" onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage <= 1} title="Προηγούμενη">
                <i className="bi bi-chevron-left" aria-hidden="true" />
              </button>
              {visiblePages.map((p) => (
                <button
                  key={p}
                  className={`btn btn--sm ${p === safePage ? "primary" : "ghost"}`}
                  onClick={() => setPage(p)}
                  aria-current={p === safePage ? "page" : undefined}
                >
                  {p}
                </button>
              ))}
              <button
                className="btn ghost btn--sm"
                onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage >= totalPages}
                title="Επόμενη"
              >
                <i className="bi bi-chevron-right" aria-hidden="true" />
              </button>
              <button
                className="btn ghost btn--sm"
                onClick={() => setPage(totalPages)}
                disabled={safePage >= totalPages}
                title="Τελευταία σελίδα"
              >
                <i className="bi bi-chevron-double-right" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="finance-spacer" />

      <Card
        title="Λίστα τιμολογίων"
        right={
          <span className="chip invoice-results-chip" data-tone="neutral">
            {total} αποτελέσματα
          </span>
        }
      >
        <div className="finance-table-wrap">
          <table className="table">
            <thead>
              <tr>
                {header("Τιμολόγιο", "number")}
                {header("Πελάτης", "client")}
                {header("Έργο", "project")}
                {header("Έκδοση", "issueDate")}
                {header("Λήξη", "dueDate")}
                {header("Ημέρες καθυστέρησης", "daysOver", "num")}
                {header("Σύνολο", "total", "num")}
                {header("Εξοφληθέν", "paid", "num")}
                {header("Υπόλοιπο", "outstanding", "num")}
                {header("Κατάσταση", "status")}
                {header("Διαβίβαση", "transmission")}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((i) => {
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
            <div className="finance-actions-row">
              <div className="finance-box finance-actions-secondary">
                <button
                  className="btn ghost btn--sm"
                  onClick={() => navigate(`/finance/revenue/invoices/${selected.id}`)}
                  title="Προβολή πλήρων λεπτομερειών"
                  aria-label="Προβολή πλήρων λεπτομερειών"
                >
                  <i className="bi bi-eye" aria-hidden="true" />
                </button>
                <button
                  className="btn ghost btn--sm"
                  onClick={() => navigate(`/finance/revenue/collections?q=${encodeURIComponent(selected.number)}`)}
                  title="Μετάβαση στις Απαιτήσεις / Εισπράξεις"
                >
                  Εισπράξεις
                </button>
              </div>
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
                    title="Αποθήκευση σημείωσης"
                    aria-label="Αποθήκευση σημείωσης"
                  >
                    <i className="bi bi-check2" aria-hidden="true" />
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

