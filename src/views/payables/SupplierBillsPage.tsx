import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { SidePanel } from "../../ui/SidePanel";
import { ActionButton } from "../../ui/ActionButton";
import { FiltersBar } from "../../ui/FiltersBar";
import type { SupplierBill, SupplierBillStatus } from "../../domain/types";
import { formatCurrency, daysBetween } from "../../domain/format";
import { getEnumParam, getStringParam } from "../../router/query";
import { useFinancePrototypeState } from "../../state/FinancePrototypeState";

function toneForBillStatus(s: SupplierBillStatus) {
  if (s === "Paid") return "success";
  if (s === "Overdue") return "danger";
  if (s === "Blocked") return "warning";
  return "neutral";
}

function toneForMatch(m: SupplierBill["match"]) {
  if (m === "Matched") return "success";
  if (m === "Mismatch") return "warning";
  return "neutral";
}

export function SupplierBillsPage() {
  const navigate = useNavigate();
  const loc = useLocation();
  const params = React.useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const initialStatus = getEnumParam<SupplierBillStatus>(
    params,
    "status",
    ["Open", "Ready", "Blocked", "Scheduled", "Paid", "Overdue"] as const
  );
  const initialQ = getStringParam(params, "q");

  const [status, setStatus] = React.useState<SupplierBillStatus | "All">(initialStatus ?? "All");
  const [q, setQ] = React.useState(initialQ ?? "");
  const [selected, setSelected] = React.useState<SupplierBill | null>(null);

  const { supplierBills, sendBillToPaymentsQueue } = useFinancePrototypeState();

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (status === "All") url.searchParams.delete("status");
    else url.searchParams.set("status", status);
    if (!q.trim()) url.searchParams.delete("q");
    else url.searchParams.set("q", q.trim());
    navigate(`${loc.pathname}?${url.searchParams.toString()}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q]);

  const filtered = supplierBills.filter((b) => {
    if (status !== "All" && b.status !== status) return false;
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return b.supplier.toLowerCase().includes(needle) || b.id.toLowerCase().includes(needle);
  });

  const now = new Date();
  const total = filtered.length;
  const overdue = filtered.filter((b) => b.status === "Overdue").length;
  const blocked = filtered.filter((b) => b.status === "Blocked").length;

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Τιμολόγια Προμηθευτών</h1>
          <p>Προβολή υποχρεώσεων: αντιστοίχιση με αίτημα, ετοιμότητα πληρωμής, λήξεις και εξαιρέσεις.</p>
        </div>
        <div className="row">
          <ActionButton variant="primary" onClick={() => navigate("/finance/spend/payments")}>
            Άνοιγμα ουράς πληρωμών
          </ActionButton>
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
          <div className="sub">χρειάζονται ενέργεια</div>
        </div>
        <div className="kpi" role="button" tabIndex={0} onClick={() => setStatus("Blocked")}>
          <div className="label">
            <span>Μπλοκαρισμένα</span>
            <span className="faint">↗</span>
          </div>
          <div className="value">{blocked}</div>
          <div className="sub">απαιτούν επίλυση</div>
        </div>
      </div>

      <Card title="Φίλτρα">
        <FiltersBar
          moreLabel="Περισσότερα φίλτρα"
          right={
            <div className="row" style={{ gap: 8 }}>
              {status !== "All" ? <Chip tone={toneForBillStatus(status)}>Ενεργό: {status}</Chip> : null}
              <span className="muted" style={{ fontSize: 12 }}>{total} αποτελέσματα</span>
            </div>
          }
        >
          <div className="field" style={{ minWidth: 280 }}>
            <label>Αναζήτηση</label>
            <input
              className="input"
              placeholder="Αναζήτηση: προμηθευτής ή id…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="field" style={{ minWidth: 220 }}>
            <label>Κατάσταση</label>
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value as SupplierBillStatus | "All")}
            >
              <option value="All">Όλα</option>
              <option value="Open">Ανοικτό</option>
              <option value="Ready">Έτοιμο</option>
              <option value="Blocked">Μπλοκαρισμένο</option>
              <option value="Scheduled">Προγραμματισμένο</option>
              <option value="Paid">Εξοφλημένο</option>
              <option value="Overdue">Ληξιπρόθεσμο</option>
            </select>
          </div>
        </FiltersBar>
      </Card>

      <div style={{ height: 14 }} />

      <Card title="Λίστα τιμολογίων">
        <div style={{ overflow: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Τιμολόγιο</th>
                <th>Προμηθευτής</th>
                <th>Παραλαβή</th>
                <th>Λήξη</th>
                <th className="num">Ημέρες καθυστέρησης</th>
                <th className="num">Ποσό</th>
                <th>Αντιστοίχιση</th>
                <th>Ετοιμότητα</th>
                <th>Συνδεδεμένο αίτημα</th>
                <th>Αιτία block / ασυμφωνίας</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const daysOver = now > new Date(b.dueDate) ? daysBetween(now, new Date(b.dueDate)) : 0;
                const isOverdue = b.status === "Overdue";
                return (
                  <tr
                    key={b.id}
                    onClick={() => setSelected(b)}
                    style={{
                      cursor: "pointer",
                      background: isOverdue ? "rgba(220, 38, 38, 0.08)" : undefined
                    }}
                  >
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{b.id}</td>
                    <td>{b.supplier}</td>
                    <td className="muted">{b.receivedAt}</td>
                    <td>
                      <span>{b.dueDate}</span>
                      {b.status === "Overdue" ? (
                        <span className="faint" style={{ marginLeft: 8 }}>
                          ({daysOver}ημ καθυστέρηση)
                        </span>
                      ) : null}
                    </td>
                    <td className="num">{b.status === "Overdue" ? `${daysOver}` : "—"}</td>
                    <td className="num">{formatCurrency(b.amount, b.currency)}</td>
                    <td>
                      <Chip tone={toneForMatch(b.match)}>{b.match}</Chip>
                    </td>
                    <td>
                      <Chip tone={toneForBillStatus(b.status)}>{b.status}</Chip>
                    </td>
                    <td className="muted">{b.linkedRequestId ?? "—"}</td>
                    <td className="muted">
                      {b.status === "Paid"
                        ? "—"
                        : b.blockedReason ??
                          (b.match === "Mismatch" ? "Mismatch vs approved request" : "—")}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="muted" style={{ padding: 16 }}>
                    Δεν βρέθηκαν τιμολόγια προμηθευτών.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <SidePanel
        open={!!selected}
        title={selected ? `${selected.id} • ${selected.supplier}` : "Supplier bill"}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <Chip tone={toneForBillStatus(selected.status)}>{selected.status}</Chip>
              <Chip tone={toneForMatch(selected.match)}>{selected.match}</Chip>
            </div>
            <div className="divider" />
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Ποσό
                </div>
                <div style={{ fontWeight: 650 }}>{formatCurrency(selected.amount, selected.currency)}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Λήξη
                </div>
                <div>{selected.dueDate}</div>
              </div>
            </div>
            {selected.status !== "Paid" && (selected.status === "Blocked" || selected.match !== "Matched") ? (
              <div className="finance-warning-box">
                <div className="finance-warning-box__title">Μπλοκαρισμένο / απαιτεί επίλυση</div>
                <div className="finance-warning-box__body">
                  {selected.blockedReason ?? "Resolve mismatch or required controls before moving this payable forward."}
                </div>
              </div>
            ) : null}
            <div className="row">
              <button className="btn" onClick={() => navigate(`/finance/spend/bills/${selected.id}`)}>
                Πλήρεις λεπτομέρειες
              </button>
              <button
                className="btn"
                disabled={selected.status === "Ready"}
                onClick={() => navigate(`/finance/spend/bills/${selected.id}`)}
              >
                Resolve readiness/mismatch
              </button>
              <button
                className="btn primary"
                disabled={selected.status !== "Ready" || selected.match !== "Matched"}
                onClick={() => {
                  sendBillToPaymentsQueue(selected.id);
                  navigate(`/finance/spend/payments?q=${encodeURIComponent(selected.id)}`);
                  setSelected(null);
                }}
              >
                Send to payments queue
              </button>
            </div>
          </div>
        ) : null}
      </SidePanel>
    </>
  );
}

