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

export function PaymentsQueuePage() {
  const perms = usePermissions();
  const navigate = useNavigate();
  const { paymentsQueue, supplierBills, executePaymentsBatch } = useFinancePrototypeState();
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

  type Segment = "Ready for payment" | "Blocked / mismatch" | "Due soon" | "Overdue payables" | "Executed (Paid)";
  const DUE_SOON_WINDOW_DAYS = 7;
  const [segment, setSegment] = React.useState<Segment>(() => {
    const now = new Date();
    const overdueExists = paymentsQueue.some((p) => new Date(p.dueDate) < now && p.status !== "Executed");
    if (readiness === "Blocked") return "Blocked / mismatch";
    if (readiness === "Ready") return "Ready for payment";
    if (overdueExists) return "Overdue payables";
    return "Due soon";
  });
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  function isEligibleForBatch(p: PaymentQueueItem) {
    // v1: only Prepared items that are Ready for payment are selectable.
    return p.readiness === "Ready" && p.status === "Prepared";
  }

  function toggleSelected(p: PaymentQueueItem) {
    if (!isEligibleForBatch(p)) return;
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

    if (segment === "Ready for payment") return p.readiness === "Ready" && p.status === "Prepared";
    if (segment === "Blocked / mismatch") return p.readiness === "Blocked";
    if (segment === "Due soon") return daysUntilDue >= 0 && daysUntilDue <= DUE_SOON_WINDOW_DAYS && !isOverdue && p.status !== "Executed";
    if (segment === "Executed (Paid)") return p.status === "Executed";
    // Overdue payables
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
          <p>Ready vs blocked, due soon/overdue payables, and batch execution handoff.</p>
        </div>
        <div className="row">
          <span className="muted" style={{ fontSize: 12 }}>
            Select eligible ready items below, then execute from the sticky batch bar.
          </span>
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
            setSegment("Due soon");
            setReadiness("All");
            setStatus("Prepared");
            setSelectedIds([]);
          }}
        >
          <div className="label">
            <span>Due soon</span>
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
            setSegment("Overdue payables");
            setReadiness("All");
            setStatus("Prepared");
            setSelectedIds([]);
          }}
        >
          <div className="label">
            <span>Overdue</span>
            <span className="faint">↗</span>
          </div>
          <div className="value">{overdueCount}</div>
          <div className="sub">πέρασαν τη λήξη</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button
          className={segment === "Ready for payment" ? "btn primary" : "btn"}
          onClick={() => {
            setSegment("Ready for payment");
            setReadiness("Ready");
            setStatus("Prepared");
            setSelectedIds([]);
            setSelected(null);
          }}
        >
          Ready for payment ({readySegmentCount})
        </button>
        <button
          className={segment === "Blocked / mismatch" ? "btn primary" : "btn"}
          onClick={() => {
            setSegment("Blocked / mismatch");
            setReadiness("Blocked");
            setStatus("Prepared");
            setSelectedIds([]);
            setSelected(null);
          }}
        >
          Blocked / mismatch ({blockedSegmentCount})
        </button>
        <button
          className={segment === "Due soon" ? "btn primary" : "btn"}
          onClick={() => {
            setSegment("Due soon");
            setReadiness("All");
            setStatus("Prepared");
            setSelectedIds([]);
            setSelected(null);
          }}
        >
          Due soon
        </button>
        <button
          className={segment === "Overdue payables" ? "btn primary" : "btn"}
          onClick={() => {
            setSegment("Overdue payables");
            setReadiness("All");
            setStatus("Prepared");
            setSelectedIds([]);
            setSelected(null);
          }}
        >
          Overdue payables ({overdueCount})
        </button>
        <button
          className={segment === "Executed (Paid)" ? "btn primary" : "btn"}
          onClick={() => {
            setSegment("Executed (Paid)");
            setReadiness("All");
            setStatus("Executed");
            setSelectedIds([]);
            setSelected(null);
          }}
        >
          Executed (Paid) ({executedCount})
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
        <div style={{ overflow: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Προμηθευτής</th>
                <th>Bill reference</th>
                <th>Due date</th>
                <th className="num">Amount</th>
                <th>Readiness</th>
                <th>Linked request</th>
                <th>Department</th>
                <th>Payment status</th>
                <th>Next step</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const due = new Date(p.dueDate);
                const daysOver = due < now ? daysBetween(now, due) : 0;
                const isOverdue = daysOver > 0 && p.status !== "Executed";
                const eligible = isEligibleForBatch(p);
                const checked = selectedIds.includes(p.id);
                const bill = supplierBills.find((b) => b.id === p.supplierBillId) ?? null;
                const linkedRequestId = bill?.linkedRequestId ?? null;
                const linkedRequest = linkedRequestId ? purchaseRequests.find((r) => r.id === linkedRequestId) ?? null : null;
                const nextStep = p.readiness === "Blocked"
                  ? "Resolve blocking issue"
                  : eligible
                    ? "Add to batch selection"
                    : "Not selectable";
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{ cursor: "pointer", background: isOverdue ? "rgba(220, 38, 38, 0.08)" : undefined }}
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
                          ({daysOver} days)
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

      <div
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 6,
          background: "rgba(255, 255, 255, 0.72)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid var(--c-border)",
          paddingTop: 12,
          paddingBottom: 12,
          marginTop: 16
        }}
      >
        <div className="row" style={{ justifyContent: "space-between", padding: "0 4px" }}>
          <div className="muted" style={{ fontSize: 12 }}>
            Selected: {selectedIds.length} · Sum: {formatCurrency(selectedTotal, selectedCurrency)}
          </div>
          <ActionButton
            variant="primary"
            disabled={selectedIds.length === 0 || !perms.canSchedulePayment}
            disabledReason={
              selectedIds.length === 0
                ? "Select eligible ready items first."
                : !perms.canSchedulePayment
                  ? "You don't have permission to execute payments."
                  : undefined
            }
            onClick={() => setConfirmSchedule(true)}
          >
            Execute batch
          </ActionButton>
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
              <Chip tone={toneForReadiness(selected.readiness)}>{selected.readiness}</Chip>
              <Chip tone={toneForStatus(selected.status)}>{selected.status}</Chip>
            </div>
            <div className="divider" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Linked request
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  {selectedLinkedRequestId ?? "—"}
                </div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Department
                </div>
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
              <div className="card" style={{ padding: 12, background: "var(--c-warning-50)" }}>
                <div style={{ fontWeight: 650, color: "#92400e" }}>Μπλοκαρισμένο</div>
                <div className="muted" style={{ marginTop: 4 }}>
                  {selected.blockedReason ?? "Resolve blocking issue before adding to batch."}
                </div>
              </div>
            ) : null}
            <div className="row">
              <button
                className="btn"
                onClick={() => navigate(`/finance/spend/bills/${selected.supplierBillId}`)}
              >
                Open bill detail
              </button>
              <ActionButton
                disabled={!isEligibleForBatch(selected)}
                disabledReason={
                  selected.readiness !== "Ready"
                    ? "Item is blocked."
                    : selected.status !== "Prepared"
                      ? "Only Prepared items can be selected."
                      : undefined
                }
                onClick={() => toggleSelected(selected)}
              >
                {selectedIds.includes(selected.id) ? "Remove from batch" : "Add to batch selection"}
              </ActionButton>
            </div>
          </div>
        ) : null}
      </SidePanel>

      <ConfirmDialog
        open={confirmSchedule}
        title="Execute payment batch"
        description={`Prototype confirmation. In v1 this will hand off selected ${selectedIds.length} items (sum ${formatCurrency(
          selectedTotal,
          selectedCurrency
        )}).`}
        confirmLabel="Execute"
        onCancel={() => setConfirmSchedule(false)}
        onConfirm={() => {
          setConfirmSchedule(false);
          executePaymentsBatch(selectedIds);
          setSelectedIds([]);
          setSelected(null);
        }}
      />
    </>
  );
}

