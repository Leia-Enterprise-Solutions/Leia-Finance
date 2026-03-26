import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { SidePanel } from "../../ui/SidePanel";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { ActionButton } from "../../ui/ActionButton";
import { FiltersBar } from "../../ui/FiltersBar";
import type { PaymentQueueItem } from "../../domain/types";
import { purchaseRequests } from "../../mock/data";
import { formatCurrency, daysBetween } from "../../domain/format";
import { getEnumParam, getStringParam } from "../../router/query";
import { usePermissions } from "../../state/permissions";
import { useFinancePrototypeState } from "../../state/FinancePrototypeState";

function toneForReadiness(r: PaymentQueueItem["readiness"]) {
  return r === "Ready" ? "success" : "warning";
}

function toneForStatus(s: PaymentQueueItem["status"]) {
  if (s === "Executed") return "success";
  if (s === "Scheduled") return "warning";
  return "neutral";
}

function labelForReadiness(r: PaymentQueueItem["readiness"]) {
  return r === "Ready" ? "Έτοιμο" : "Μπλοκαρισμένο";
}

function labelForQueueStatus(s: PaymentQueueItem["status"]) {
  // Queue lifecycle (not a business document status).
  if (s === "Prepared") return "Προετοιμασία";
  if (s === "Scheduled") return "Προγραμματισμένο";
  return "Εκτελεσμένο";
}

export function PaymentsQueuePage() {
  const perms = usePermissions();
  const navigate = useNavigate();
  const { paymentsQueue, supplierBills, schedulePaymentsBatch, executePaymentsBatch } = useFinancePrototypeState();
  const loc = useLocation();
  const params = React.useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const initialReadiness = getEnumParam<PaymentQueueItem["readiness"]>(
    params,
    "readiness",
    ["Ready", "Blocked"] as const
  );
  const initialStatus = getEnumParam<PaymentQueueItem["status"]>(
    params,
    "status",
    ["Prepared", "Scheduled", "Executed"] as const
  );
  const initialQ = getStringParam(params, "q");

  const [readiness, setReadiness] = React.useState<PaymentQueueItem["readiness"] | "All">(
    initialReadiness ?? "All"
  );
  const [status, setStatus] = React.useState<PaymentQueueItem["status"] | "All">(initialStatus ?? "All");
  const [q, setQ] = React.useState(initialQ ?? "");
  const [selected, setSelected] = React.useState<PaymentQueueItem | null>(null);
  const [confirmSchedule, setConfirmSchedule] = React.useState(false);
  const [confirmExecute, setConfirmExecute] = React.useState(false);

  type Segment =
    | "Έτοιμες για πληρωμή"
    | "Μπλοκαρισμένες / ασυμφωνία"
    | "Λήγουν σύντομα"
    | "Ληξιπρόθεσμες υποχρεώσεις"
    | "Εκτελεσμένες (Paid)";
  const DUE_SOON_WINDOW_DAYS = 7;
  const [segment, setSegment] = React.useState<Segment>(() => {
    const now = new Date();
    const overdueExists = paymentsQueue.some((p) => new Date(p.dueDate) < now && p.status !== "Executed");
    if (readiness === "Blocked") return "Μπλοκαρισμένες / ασυμφωνία";
    if (readiness === "Ready") return "Έτοιμες για πληρωμή";
    if (overdueExists) return "Ληξιπρόθεσμες υποχρεώσεις";
    return "Λήγουν σύντομα";
  });
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  function isSelectable(p: PaymentQueueItem) {
    // v1: selection means "candidate for scheduling/execution", not executed.
    return p.readiness === "Ready" && p.status !== "Executed";
  }

  function toggleSelected(p: PaymentQueueItem) {
    if (!isSelectable(p)) return;
    setSelectedIds((prev) => (prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]));
  }

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (readiness === "All") url.searchParams.delete("readiness");
    else url.searchParams.set("readiness", readiness);
    if (status === "All") url.searchParams.delete("status");
    else url.searchParams.set("status", status);
    if (!q.trim()) url.searchParams.delete("q");
    else url.searchParams.set("q", q.trim());
    navigate(`${loc.pathname}?${url.searchParams.toString()}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readiness, status, q]);

  const now = new Date();
  const filtered = paymentsQueue.filter((p) => {
    if (readiness !== "All" && p.readiness !== readiness) return false;
    if (status !== "All" && p.status !== status) return false;
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    const matchesQuery =
      p.supplier.toLowerCase().includes(needle) ||
      p.supplierBillId.toLowerCase().includes(needle) ||
      p.id.toLowerCase().includes(needle);

    if (!matchesQuery) return false;

    const due = new Date(p.dueDate);
    const daysUntilDue = daysBetween(due, now); // positive when due in the future
    const isOverdue = due < now && daysBetween(now, due) > 0;

    if (segment === "Έτοιμες για πληρωμή") return p.readiness === "Ready" && p.status === "Prepared";
    if (segment === "Μπλοκαρισμένες / ασυμφωνία") return p.readiness === "Blocked";
    if (segment === "Λήγουν σύντομα") return daysUntilDue >= 0 && daysUntilDue <= DUE_SOON_WINDOW_DAYS && !isOverdue && p.status !== "Executed";
    if (segment === "Εκτελεσμένες (Paid)") return p.status === "Executed";
    // Ληξιπρόθεσμες υποχρεώσεις
    return isOverdue && p.status !== "Executed";
  });

  const total = filtered.length;
  const needle = q.trim().toLowerCase();
  const matchesQuery = (p: PaymentQueueItem) => {
    if (!needle) return true;
    return (
      p.supplier.toLowerCase().includes(needle) ||
      p.supplierBillId.toLowerCase().includes(needle) ||
      p.id.toLowerCase().includes(needle)
    );
  };

  const dueSoonCount = paymentsQueue.filter((p) => {
    if (!matchesQuery(p)) return false;
    if (p.status === "Executed") return false;
    const due = new Date(p.dueDate);
    const daysUntilDue = daysBetween(due, now);
    const isOverdue = due < now && daysBetween(now, due) > 0;
    return daysUntilDue >= 0 && daysUntilDue <= DUE_SOON_WINDOW_DAYS && !isOverdue;
  }).length;

  const overdueCount = paymentsQueue.filter((p) => {
    if (!matchesQuery(p)) return false;
    if (p.status === "Executed") return false;
    const due = new Date(p.dueDate);
    const isOverdue = due < now && daysBetween(now, due) > 0;
    return isOverdue;
  }).length;

  const readySegmentCount = paymentsQueue.filter((p) => {
    if (!matchesQuery(p)) return false;
    if (p.status === "Executed") return false;
    return p.readiness === "Ready" && p.status === "Prepared";
  }).length;

  const blockedSegmentCount = paymentsQueue.filter((p) => {
    if (!matchesQuery(p)) return false;
    if (p.status === "Executed") return false;
    return p.readiness === "Blocked";
  }).length;

  const executedCount = paymentsQueue.filter((p) => {
    if (p.status !== "Executed") return false;
    return matchesQuery(p);
  }).length;

  const selectedItems = selectedIds
    .map((id) => paymentsQueue.find((p) => p.id === id))
    .filter((p): p is PaymentQueueItem => p != null);
  const selectedTotal = selectedItems.reduce((a, p) => a + p.amount, 0);
  const selectedCurrency = selectedItems[0]?.currency ?? "EUR";
  const selectedPrepared = selectedItems.filter((p) => p.status === "Prepared").length;
  const selectedScheduled = selectedItems.filter((p) => p.status === "Scheduled").length;

  const selectedBill = selected ? supplierBills.find((b) => b.id === selected.supplierBillId) ?? null : null;
  const selectedLinkedRequestId = selectedBill?.linkedRequestId ?? null;
  const selectedLinkedRequest = selectedLinkedRequestId
    ? purchaseRequests.find((r) => r.id === selectedLinkedRequestId) ?? null
    : null;

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Ουρά πληρωμών</h1>
          <p>Workbench εκτέλεσης πληρωμών v1: προετοιμασία → προγραμματισμός → εκτέλεση. Τα φίλτρα λήξης είναι τοπικά.</p>
        </div>
        <div className="row">
          <span className="finance-meta">Επιλέξτε Ready items (Prepared/Scheduled). Η επιλογή δεν σημαίνει «εκτελέστηκε».</span>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi">
          <div className="label">
            <span>Σύνολο</span>
          </div>
          <div className="value">{total}</div>
          <div className="sub">εγγραφές στην προβολή</div>
        </div>
        <div
          className="kpi"
          role="button"
          tabIndex={0}
          onClick={() => {
            setSegment("Λήγουν σύντομα");
            setReadiness("All");
            setStatus("Prepared");
            setSelectedIds([]);
          }}
        >
          <div className="label">
            <span>Λήγουν σύντομα</span>
            <span className="faint">↗</span>
          </div>
          <div className="value">{dueSoonCount}</div>
          <div className="sub">σε κοντινή λήξη</div>
        </div>
        <div
          className="kpi"
          role="button"
          tabIndex={0}
          onClick={() => {
            setSegment("Ληξιπρόθεσμες υποχρεώσεις");
            setReadiness("All");
            setStatus("Prepared");
            setSelectedIds([]);
          }}
        >
          <div className="label">
            <span>Ληξιπρόθεσμα</span>
            <span className="faint">↗</span>
          </div>
          <div className="value">{overdueCount}</div>
          <div className="sub">πέρασαν τη λήξη</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button
          className={segment === "Έτοιμες για πληρωμή" ? "btn primary" : "btn"}
          onClick={() => {
            setSegment("Έτοιμες για πληρωμή");
            setReadiness("Ready");
            setStatus("Prepared");
            setSelectedIds([]);
            setSelected(null);
          }}
        >
          Έτοιμες για πληρωμή ({readySegmentCount})
        </button>
        <button
          className={segment === "Μπλοκαρισμένες / ασυμφωνία" ? "btn primary" : "btn"}
          onClick={() => {
            setSegment("Μπλοκαρισμένες / ασυμφωνία");
            setReadiness("Blocked");
            setStatus("Prepared");
            setSelectedIds([]);
            setSelected(null);
          }}
        >
          Μπλοκαρισμένες / ασυμφωνία ({blockedSegmentCount})
        </button>
        <button
          className={segment === "Λήγουν σύντομα" ? "btn primary" : "btn"}
          onClick={() => {
            setSegment("Λήγουν σύντομα");
            setReadiness("All");
            setStatus("Prepared");
            setSelectedIds([]);
            setSelected(null);
          }}
        >
          Λήγουν σύντομα
        </button>
        <button
          className={segment === "Ληξιπρόθεσμες υποχρεώσεις" ? "btn primary" : "btn"}
          onClick={() => {
            setSegment("Ληξιπρόθεσμες υποχρεώσεις");
            setReadiness("All");
            setStatus("Prepared");
            setSelectedIds([]);
            setSelected(null);
          }}
        >
          Ληξιπρόθεσμες υποχρεώσεις ({overdueCount})
        </button>
        <button
          className={segment === "Εκτελεσμένες (Paid)" ? "btn primary" : "btn"}
          onClick={() => {
            setSegment("Εκτελεσμένες (Paid)");
            setReadiness("All");
            setStatus("Executed");
            setSelectedIds([]);
            setSelected(null);
          }}
        >
          Εκτελεσμένες (Paid) ({executedCount})
        </button>
      </div>

      <Card title="Φίλτρα">
        <FiltersBar
          moreLabel="Περισσότερα φίλτρα"
          right={
            <div className="row" style={{ gap: 8 }}>
              <Chip tone="neutral">{segment}</Chip>
              <span className="muted" style={{ fontSize: 12 }}>
                {total} αποτελέσματα
              </span>
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
        </FiltersBar>
      </Card>

      <div style={{ height: 14 }} />

      <Card title="Ουρά">
        <div className="finance-table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Επιλογή</th>
                <th>Προμηθευτής</th>
                <th>Αναφορά τιμολογίου</th>
                <th>Ημ/νία λήξης</th>
                <th className="num">Ποσό</th>
                <th>Ετοιμότητα</th>
                <th>Συνδεδεμένο αίτημα</th>
                <th>Τμήμα</th>
                <th>Κατάσταση πληρωμής</th>
                <th>Επόμενο βήμα</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const due = new Date(p.dueDate);
                const daysOver = due < now ? daysBetween(now, due) : 0;
                const isOverdue = daysOver > 0 && p.status !== "Executed";
                const eligible = isSelectable(p);
                const checked = selectedIds.includes(p.id);
                const bill = supplierBills.find((b) => b.id === p.supplierBillId) ?? null;
                const linkedRequestId = bill?.linkedRequestId ?? null;
                const linkedRequest = linkedRequestId ? purchaseRequests.find((r) => r.id === linkedRequestId) ?? null : null;
                const nextStep =
                  p.readiness === "Blocked"
                    ? "Προβολή αιτίας block"
                    : eligible
                      ? p.status === "Prepared"
                        ? "Προγραμματισμός"
                        : p.status === "Scheduled"
                          ? "Εκτέλεση"
                          : "—"
                      : "Μη επιλέξιμο";
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="finance-table-clickrow"
                    style={{ background: isOverdue ? "rgba(220, 38, 38, 0.08)" : undefined }}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!eligible}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelected(p);
                        }}
                      />
                    </td>
                    <td>{p.supplier}</td>
                    <td className="muted">{p.supplierBillId}</td>
                    <td>
                      <span>{p.dueDate}</span>
                      {isOverdue ? (
                        <span className="faint" style={{ marginLeft: 8 }}>
                          ({daysOver} ημ.)
                        </span>
                      ) : null}
                    </td>
                    <td className="num">{formatCurrency(p.amount, p.currency)}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <Chip tone={toneForReadiness(p.readiness)}>{p.readiness}</Chip>
                        {p.readiness === "Blocked" ? (
                          <span className="faint" style={{ fontSize: 12 }}>
                            {p.blockedReason ?? "—"}
                          </span>
                        ) : (
                          <span className="faint" style={{ fontSize: 12 }}>—</span>
                        )}
                      </div>
                    </td>
                    <td className="muted">{linkedRequestId ?? "—"}</td>
                    <td className="muted">{linkedRequest?.department ?? "—"}</td>
                    <td>
                      <Chip tone={toneForStatus(p.status)}>{p.status}</Chip>
                    </td>
                    <td className="muted">{nextStep}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="muted" style={{ padding: 16 }}>
                    Δεν βρέθηκαν εγγραφές.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="finance-sticky-batchbar">
        <div className="finance-sticky-batchbar__inner">
          <div className="finance-meta">
            Επιλεγμένα: {selectedIds.length} (Prepared: {selectedPrepared}, Scheduled: {selectedScheduled}) · Σύνολο:{" "}
            {formatCurrency(selectedTotal, selectedCurrency)}
          </div>
          <div className="row">
            <ActionButton
              disabled={selectedPrepared === 0 || !perms.canSchedulePayment}
              disabledReason={
                selectedPrepared === 0
                  ? "Επιλέξτε Prepared items (Ready) για προγραμματισμό."
                  : !perms.canSchedulePayment
                    ? "Δεν έχετε δικαίωμα προγραμματισμού/εκτέλεσης."
                    : undefined
              }
              onClick={() => setConfirmSchedule(true)}
            >
              Προγραμματισμός Επιλεγμένων
            </ActionButton>
            <ActionButton
              variant="primary"
              disabled={selectedScheduled === 0 || !perms.canSchedulePayment}
              disabledReason={
                selectedScheduled === 0
                  ? "Επιλέξτε Scheduled items για εκτέλεση."
                  : !perms.canSchedulePayment
                    ? "Δεν έχετε δικαίωμα προγραμματισμού/εκτέλεσης."
                    : undefined
              }
              onClick={() => setConfirmExecute(true)}
            >
              Εκτέλεση Επιλεγμένων
            </ActionButton>
          </div>
        </div>
      </div>

      <SidePanel
        open={!!selected}
        title={selected ? `${selected.id} • ${selected.supplier}` : "Payment item"}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <Chip tone={toneForReadiness(selected.readiness)}>{labelForReadiness(selected.readiness)}</Chip>
              <Chip tone={toneForStatus(selected.status)}>{labelForQueueStatus(selected.status)}</Chip>
            </div>
            <div className="divider" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Συνδεδεμένο αίτημα</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  {selectedLinkedRequestId ?? "—"}
                </div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Τμήμα</div>
                <div>{selectedLinkedRequest?.department ?? "—"}</div>
              </div>
            </div>
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
            {selected.readiness === "Blocked" ? (
              <div className="finance-warning-box">
                <div className="finance-warning-box__title">Μπλοκαρισμένο</div>
                <div className="finance-warning-box__body">
                  {selected.blockedReason ?? "Resolve blocking issue before adding to batch."}
                </div>
              </div>
            ) : null}
            <div className="row" style={{ justifyContent: "space-between" }}>
              <button
                className="btn ghost btn--sm"
                onClick={() => navigate(`/finance/spend/bills/${selected.supplierBillId}`)}
                title="Προβολή τιμολογίου προμηθευτή"
              >
                Προβολή
              </button>
              <ActionButton
                variant="primary"
                disabled={!isSelectable(selected)}
                disabledReason={
                  selected.readiness !== "Ready"
                    ? "Item is blocked."
                    : selected.status === "Executed"
                      ? "Item is already executed."
                      : undefined
                }
                onClick={() => toggleSelected(selected)}
              >
                {selectedIds.includes(selected.id) ? "Αφαίρεση από επιλογή" : "Προσθήκη στην επιλογή"}
              </ActionButton>
            </div>
          </div>
        ) : null}
      </SidePanel>

      <ConfirmDialog
        open={confirmSchedule}
        title="Προγραμματισμός επιλεγμένων πληρωμών"
        description={`Prototype confirmation. This will schedule ${selectedPrepared} Prepared item(s) (sum ${formatCurrency(
          selectedTotal,
          selectedCurrency
        )}).`}
        confirmLabel="Προγραμματισμός"
        onCancel={() => setConfirmSchedule(false)}
        onConfirm={() => {
          setConfirmSchedule(false);
          const ids = selectedItems.filter((p) => p.status === "Prepared").map((p) => p.id);
          schedulePaymentsBatch(ids);
        }}
      />

      <ConfirmDialog
        open={confirmExecute}
        title="Εκτέλεση προγραμματισμένων πληρωμών"
        description={`Prototype confirmation. This will execute ${selectedScheduled} Scheduled item(s).`}
        confirmLabel="Εκτέλεση"
        onCancel={() => setConfirmExecute(false)}
        onConfirm={() => {
          setConfirmExecute(false);
          const ids = selectedItems.filter((p) => p.status === "Scheduled").map((p) => p.id);
          executePaymentsBatch(ids);
          setSelectedIds([]);
          setSelected(null);
        }}
      />
    </>
  );
}

