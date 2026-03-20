import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "../../../domain/format";
import { supplierBills } from "../../../mock/data";

type Slice = {
  supplier: string;
  value: number;
  pct: number;
};

const COLORS = [
  "rgba(245, 158, 11, 0.92)",
  "rgba(124, 92, 255, 0.92)",
  "rgba(34, 211, 238, 0.92)",
  "rgba(16, 185, 129, 0.92)",
  "rgba(244, 63, 94, 0.88)",
  "rgba(59, 130, 246, 0.90)"
];

function buildSlices(): { total: number; slices: Slice[] } {
  const totals = new Map<string, number>();
  for (const b of supplierBills) {
    totals.set(b.supplier, (totals.get(b.supplier) ?? 0) + b.amount);
  }

  const slicesRaw = Array.from(totals.entries())
    .map(([supplier, value]) => ({ supplier, value }))
    .sort((a, b) => b.value - a.value);

  const total = slicesRaw.reduce((a, s) => a + s.value, 0);
  const slices: Slice[] = slicesRaw.map((s) => ({
    ...s,
    pct: total > 0 ? (s.value / total) * 100 : 0
  }));

  return { total, slices };
}

export function ExpensesBySupplierPieChart() {
  const { total, slices } = React.useMemo(() => buildSlices(), []);

  return (
    <div style={{ width: "100%", minWidth: 0, height: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <div className="muted" style={{ fontSize: 12 }}>
          Σύνολο εξόδων
        </div>
        <div style={{ fontWeight: 700 }}>{formatCurrency(total)}</div>
      </div>

      {/* Pie chart cap is applied only via `.overview-piechart-cap` CSS (pie-only max-height). */}
      <div className="overview-piechart-cap" style={{ width: "100%", height: "100%", flex: 1, minWidth: 0, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <PieChart>
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.05)"
              }}
              formatter={(value: unknown) => formatCurrency(Number(value))}
              labelFormatter={(label: unknown) => String(label)}
            />
            <Pie
              data={slices}
              dataKey="value"
              nameKey="supplier"
              cx="50%"
              cy="50%"
              outerRadius={92}
              innerRadius={48}
              paddingAngle={2}
            >
              {slices.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
        {slices.slice(0, 6).map((s, idx) => (
          <div key={s.supplier} className="row" style={{ justifyContent: "space-between" }}>
            <div className="row" style={{ gap: 10, minWidth: 0 }}>
              <span
                aria-hidden
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: COLORS[idx % COLORS.length],
                  flex: "0 0 auto"
                }}
              />
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.supplier}
              </span>
            </div>
            <div className="row" style={{ gap: 10 }}>
              <span className="muted" style={{ fontVariantNumeric: "tabular-nums" }}>
                {Math.round(s.pct)}%
              </span>
              <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 650 }}>
                {formatCurrency(s.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

