import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatCurrency } from "../../../domain/format";

const data = [
  { name: "Jan", committed: 6200, actual: 5100 },
  { name: "Feb", committed: 7400, actual: 6100 },
  { name: "Mar", committed: 9200, actual: 6800 }
];

export function CommittedVsActualChart() {
  return (
    <div style={{ width: "100%", height: 220, minWidth: 0, minHeight: 0 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="rgba(226, 232, 240, 0.8)" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis
            width={44}
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
          />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.05)"
            }}
            formatter={(value: unknown, name: unknown) => [formatCurrency(Number(value)), String(name)]}
          />
          <Bar dataKey="committed" fill="rgba(17, 24, 39, 0.9)" radius={[10, 10, 10, 10]} />
          <Bar dataKey="actual" fill="rgba(217, 119, 6, 0.85)" radius={[10, 10, 10, 10]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

