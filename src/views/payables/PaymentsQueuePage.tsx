import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { SidePanel } from "../../ui/SidePanel";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { ActionButton } from "../../ui/ActionButton";
import { FiltersBar } from "../../ui/FiltersBar";
import type { PaymentQueueItem } from "../../domain/types";
import { paymentsQueue as allPayments } from "../../mock/data";
import { formatCurrency, daysBetween } from "../../domain/format";
import { getEnumParam, getStringParam } from "../../router/query";
import { usePermissions } from "../../state/permissions";

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

  const filtered = allPayments.filter((p) => {
    if (readiness !== "All" && p.readiness !== readiness) return false;
    if (status !== "All" && p.status !== status) return false;
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return (
      p.supplier.toLowerCase().includes(needle) ||
      p.supplierBillId.toLowerCase().includes(needle) ||
      p.id.toLowerCase().includes(needle)
    );
  });

  const now = new Date();
  const total = filtered.length;
  const ready = filtered.filter((p) => p.readiness === "Ready").length;
  const blocked = filtered.filter((p) => p.readiness === "Blocked").length;

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Ουρά πληρωμών</h1>
          <p>Έτοιμα vs μπλοκαρισμένα, ημερομηνίες λήξης, επιλογή παρτίδας και παρακολούθηση εκτέλεσης.</p>
        </div>
        <div className="row">
          <button className="btn">Επιλογή παρτίδας</button>
          <ActionButton
            variant="primary"
            disabled={!perms.canSchedulePayment}
            disabledReason={!perms.canSchedulePayment ? "You don't have permission to schedule payments." : undefined}
            onClick={() => setConfirmSchedule(true)}
          >
            Προγραμματισμός πληρωμής
          </ActionButton>
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
        <div className="kpi" role="button" tabIndex={0} onClick={() => setReadiness("Ready")}>
          <div className="label">
            <span>Έτοιμα</span>
            <span className="faint">↗</span>
          </div>
          <div className="value">{ready}</div>
          <div className="sub">προς εκτέλεση</div>
        </div>
        <div className="kpi" role="button" tabIndex={0} onClick={() => setReadiness("Blocked")}>
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
              {readiness !== "All" ? <Chip tone={toneForReadiness(readiness)}>Ενεργό: {readiness}</Chip> : null}
              {status !== "All" ? <Chip tone={toneForStatus(status)}>Ενεργό: {status}</Chip> : null}
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
            <label>Ετοιμότητα</label>
            <select
              className="select"
              value={readiness}
              onChange={(e) => setReadiness(e.target.value as PaymentQueueItem["readiness"] | "All")}
            >
              <option value="All">Όλα</option>
              <option value="Ready">Έτοιμο</option>
              <option value="Blocked">Μπλοκαρισμένο</option>
            </select>
          </div>
          <div className="field" style={{ minWidth: 220 }}>
            <label>Κατάσταση</label>
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value as PaymentQueueItem["status"] | "All")}
            >
              <option value="All">Όλες</option>
              <option value="Prepared">Prepared</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Executed">Executed</option>
            </select>
          </div>
        </FiltersBar>
      </Card>

      <div style={{ height: 14 }} />

      <Card title="Ουρά">
        <div style={{ overflow: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Στοιχείο</th>
                <th>Προμηθευτής</th>
                <th>Τιμολόγιο</th>
                <th>Λήξη</th>
                <th className="num">Amount</th>
                <th>Ετοιμότητα</th>
                <th>Κατάσταση</th>
                <th>Αιτία</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const daysOver = now > new Date(p.dueDate) ? daysBetween(now, new Date(p.dueDate)) : 0;
                return (
                  <tr key={p.id} onClick={() => setSelected(p)} style={{ cursor: "pointer" }}>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{p.id}</td>
                    <td>{p.supplier}</td>
                    <td className="muted">{p.supplierBillId}</td>
                    <td>
                      <span>{p.dueDate}</span>
                      {daysOver > 0 ? (
                        <span className="faint" style={{ marginLeft: 8 }}>
                          ({daysOver}ημ καθυστέρηση)
                        </span>
                      ) : null}
                    </td>
                    <td className="num">{formatCurrency(p.amount, p.currency)}</td>
                    <td>
                      <Chip tone={toneForReadiness(p.readiness)}>{p.readiness}</Chip>
                    </td>
                    <td>
                      <Chip tone={toneForStatus(p.status)}>{p.status}</Chip>
                    </td>
                    <td className="muted">{p.blockedReason ?? "—"}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="muted" style={{ padding: 16 }}>
                    Δεν βρέθηκαν εγγραφές.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

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
                  {selected.blockedReason ?? "Resolve blocking reason before scheduling."}
                </div>
              </div>
            ) : null}
            <div className="row">
              <button className="btn">Άνοιγμα τιμολογίου</button>
              <ActionButton
                disabled={selected.readiness !== "Ready" || selected.status !== "Prepared"}
                disabledReason={
                  selected.readiness !== "Ready"
                    ? "Item is blocked."
                    : selected.status !== "Prepared"
                      ? "Only prepared items can be selected."
                      : undefined
                }
              >
                Επιλογή για παρτίδα
              </ActionButton>
              <ActionButton
                variant="primary"
                disabled={!perms.canSchedulePayment || selected.readiness !== "Ready"}
                disabledReason={
                  !perms.canSchedulePayment
                    ? "You don't have permission to schedule payments."
                    : selected.readiness !== "Ready"
                      ? "Resolve blocking reasons first."
                      : undefined
                }
                onClick={() => setConfirmSchedule(true)}
              >
                Προγραμματισμός
              </ActionButton>
            </div>
          </div>
        ) : null}
      </SidePanel>

      <ConfirmDialog
        open={confirmSchedule}
        title="Προγραμματισμός πληρωμής"
        description="Επιβεβαίωση πρωτοτύπου. Στην v1 θα δημιουργεί κατάσταση «Scheduled» και θα καταγράφει συμβάν audit."
        confirmLabel="Προγραμματισμός"
        onCancel={() => setConfirmSchedule(false)}
        onConfirm={() => setConfirmSchedule(false)}
      />
    </>
  );
}

