import React from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "../../../domain/format";

const data = [
  { name: "W1", invoiced: 12000, collected: 4000 },
  { name: "W2", invoiced: 9800, collected: 7600 },
  { name: "W3", invoiced: 14200, collected: 10200 },
  { name: "W4", invoiced: 8600, collected: 12400 }
];

export function InvoicedVsCollectedChart() {
  return (
    <div style={{ width: "100%", height: "100%", minWidth: 0, minHeight: 0 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
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
          <Line type="monotone" dataKey="invoiced" stroke="var(--c-primary)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="collected" stroke="#16a34a" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

