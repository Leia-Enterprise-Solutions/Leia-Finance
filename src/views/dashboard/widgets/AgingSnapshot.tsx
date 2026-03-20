import React from "react";
import { useNavigate } from "react-router-dom";
import { Chip } from "../../../ui/Chip";
import { formatCurrency } from "../../../domain/format";
import { receivables, supplierBills } from "../../../mock/data";

type Bucket = {
  key: "notDue" | "dueSoon" | "overdue" | "ready" | "blocked";
  label: string;
  amount: number;
  tone: "neutral" | "warning" | "danger";
  queryValue: string;
};

function bucketizeReceivables(): Bucket[] {
  const notDue = receivables.filter((r) => r.signal === "Not Due").reduce((a, r) => a + r.outstanding, 0);
  const dueSoon = receivables.filter((r) => r.signal === "Due Soon").reduce((a, r) => a + r.outstanding, 0);
  const overdue = receivables.filter((r) => r.signal === "Overdue").reduce((a, r) => a + r.outstanding, 0);
  return [
    { key: "notDue", label: "Μη ληξιπρ.", amount: notDue, tone: "neutral", queryValue: "Not Due" },
    { key: "dueSoon", label: "Σύντομα", amount: dueSoon, tone: "warning", queryValue: "Due Soon" },
    { key: "overdue", label: "Ληξιπρ.", amount: overdue, tone: "danger", queryValue: "Overdue" }
  ];
}

function bucketizePayables(): Bucket[] {
  const ready = supplierBills.filter((b) => b.status === "Ready").reduce((a, b) => a + b.amount, 0);
  const blocked = supplierBills.filter((b) => b.status === "Blocked").reduce((a, b) => a + b.amount, 0);
  const overdue = supplierBills.filter((b) => b.status === "Overdue").reduce((a, b) => a + b.amount, 0);
  return [
    { key: "ready", label: "Έτοιμες", amount: ready, tone: "neutral", queryValue: "Ready" },
    { key: "blocked", label: "Μπλοκ.", amount: blocked, tone: "warning", queryValue: "Blocked" },
    { key: "overdue", label: "Ληξιπρ.", amount: overdue, tone: "danger", queryValue: "Overdue" }
  ];
}

export function AgingSnapshot({
  kind,
  compact
}: {
  kind: "receivables" | "payables";
  /** When true, omit top total row (e.g. when used inside domain panel with its own header) */
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const buckets = kind === "receivables" ? bucketizeReceivables() : bucketizePayables();
  const total = buckets.reduce((a, b) => a + b.amount, 0);

  return (
    <div className={compact ? "aging-snapshot aging-snapshot--compact" : "aging-snapshot"} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {!compact && (
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="muted" style={{ fontSize: 12 }}>
              Total
            </div>
            <div style={{ fontWeight: 650, fontSize: 16 }}>{formatCurrency(total)}</div>
          </div>
          <div className="row">
            {buckets.map((b) => (
              <Chip key={b.label} tone={b.tone} title={b.label}>
                {b.label}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {buckets.map((b) => (
          <div
            key={b.label}
            className="card"
            style={{ padding: 12, cursor: "pointer" }}
            role="button"
            tabIndex={0}
            onClick={() => {
              if (kind === "receivables") {
                navigate(`/finance/revenue/collections?signal=${encodeURIComponent(b.queryValue)}`);
              } else {
                // payables bucket -> supplier bills list filtered by status
                navigate(`/finance/spend/bills?status=${encodeURIComponent(b.queryValue)}`);
              }
            }}
          >
            <div className="muted" style={{ fontSize: 12 }}>
              {b.label}
            </div>
            <div style={{ fontWeight: 650 }}>{formatCurrency(b.amount)}</div>
            <div className="faint" style={{ fontSize: 12 }}>
              {total > 0 ? `${Math.round((b.amount / total) * 100)}%` : "0%"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

