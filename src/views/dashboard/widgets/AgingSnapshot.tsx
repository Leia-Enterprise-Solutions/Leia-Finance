import React from "react";
import { useNavigate } from "react-router-dom";
import { Chip } from "../../../ui/Chip";
import { formatCurrency } from "../../../domain/format";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useFinancePrototypeState } from "../../../state/FinancePrototypeState";

type Bucket = {
  key: "notDue" | "dueSoon" | "overdue" | "ready" | "blocked";
  label: string;
  amount: number;
  tone: "neutral" | "warning" | "danger";
  queryValue: string;
};

function bucketizeReceivables(receivables: { signal: string; outstanding: number }[]): Bucket[] {
  const notDue = receivables.filter((r) => r.signal === "Not Due").reduce((a, r) => a + r.outstanding, 0);
  const dueSoon = receivables.filter((r) => r.signal === "Due Soon").reduce((a, r) => a + r.outstanding, 0);
  const overdue = receivables.filter((r) => r.signal === "Overdue").reduce((a, r) => a + r.outstanding, 0);
  return [
    { key: "notDue", label: "Μη ληξιπρ.", amount: notDue, tone: "neutral", queryValue: "Not Due" },
    { key: "dueSoon", label: "Σύντομα", amount: dueSoon, tone: "warning", queryValue: "Due Soon" },
    { key: "overdue", label: "Ληξιπρ.", amount: overdue, tone: "danger", queryValue: "Overdue" }
  ];
}

function bucketizePayables(supplierBills: { status: string; amount: number }[]): Bucket[] {
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
  const { receivables, supplierBills } = useFinancePrototypeState();
  const buckets = kind === "receivables" ? bucketizeReceivables(receivables) : bucketizePayables(supplierBills);
  const total = buckets.reduce((a, b) => a + b.amount, 0);

  const colorForTone = (tone: Bucket["tone"]) => {
    // Modern tones: rose (danger), amber (warning), slate (neutral)
    if (tone === "danger") return "rgba(244, 63, 94, 0.92)"; // rose-500
    if (tone === "warning") return "rgba(245, 158, 11, 0.92)"; // amber-500
    return "rgba(100, 116, 139, 0.92)"; // slate-500
  };

  function onBucketClick(bucket: Bucket) {
    if (kind === "receivables") {
      navigate(`/finance/revenue/collections?signal=${encodeURIComponent(bucket.queryValue)}`);
    } else {
      // payables bucket -> supplier bills list filtered by status
      navigate(`/finance/spend/bills?status=${encodeURIComponent(bucket.queryValue)}`);
    }
  }

  // In compact mode we render a chart-first visual (better scan) but keep drilldown behavior via clickable legend.
  if (compact) {
    return (
      <div className={kind === "receivables" ? "aging-snapshot aging-snapshot--compact" : "aging-snapshot aging-snapshot--compact"}>
        <div style={{ display: "flex", width: "100%", height: 170, minWidth: 0, minHeight: 0, gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0, height: "100%" }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.05)"
                  }}
                  formatter={(value: unknown) => [formatCurrency(Number(value)), ""]}
                />
                <Pie
                  data={buckets}
                  dataKey="amount"
                  nameKey="label"
                  cx="50%"
                  cy="100%"
                  innerRadius={38}
                  outerRadius={66}
                  startAngle={180}
                  endAngle={0}
                  paddingAngle={2}
                >
                  {buckets.map((b) => (
                    <Cell
                      key={b.key}
                      fill={colorForTone(b.tone)}
                      stroke="rgba(255, 255, 255, 0.92)"
                      strokeWidth={1}
                      onClick={() => onBucketClick(b)}
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend on the same row as the chart */}
          <div
            style={{
              flex: "0 0 190px",
              minWidth: 150,
              height: "100%",
              padding: "10px 10px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.86)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(226,232,240,0.95)",
              boxShadow: "0 14px 34px rgba(15, 23, 42, 0.06)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 10
            }}
          >
            {buckets.map((b) => {
              const pct = total > 0 ? Math.round((b.amount / total) * 100) : 0;
              return (
                <div
                  key={b.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => onBucketClick(b)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onBucketClick(b);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="row" style={{ gap: 8, alignItems: "center" }}>
                    <span
                      aria-hidden
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: colorForTone(b.tone),
                      flex: "0 0 auto",
                      boxShadow: "0 0 0 3px rgba(255,255,255,0.55)"
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--c-muted)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {b.label}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {formatCurrency(b.amount)} ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="aging-snapshot" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
            onClick={() => onBucketClick(b)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onBucketClick(b);
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

