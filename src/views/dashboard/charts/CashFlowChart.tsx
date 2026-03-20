import React from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatCurrency } from "../../../domain/format";
import { invoices, supplierBills } from "../../../mock/data";

type WeekBucket = {
  start: Date;
  end: Date;
  label: string;
  inflow: number;
  outflow: number;
};

function startOfWeekMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0..6 (Sun..Sat)
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, days: number) {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
}

function formatGreekShort(d: Date) {
  // Keep it simple & deterministic enough for a prototype.
  return d.toLocaleDateString("el-GR", { day: "2-digit", month: "short" });
}

function buildCashFlowBuckets(weeks: number): WeekBucket[] {
  const invoiceDates = invoices.map((i) => new Date(i.dueDate));
  const billDates = supplierBills.map((b) => new Date(b.dueDate));
  const allDates = [...invoiceDates, ...billDates].filter((d) => !Number.isNaN(d.getTime()));
  if (allDates.length === 0) {
    const today = new Date();
    const monday = startOfWeekMonday(today);
    return Array.from({ length: weeks }, (_, idx) => {
      const start = addDays(monday, idx * 7);
      const end = addDays(start, 6);
      return { start, end, label: `W${idx + 1}`, inflow: 0, outflow: 0 };
    });
  }

  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
  const lastMonday = startOfWeekMonday(maxDate);
  const start = addDays(lastMonday, -(weeks - 1) * 7);

  const buckets: WeekBucket[] = [];
  for (let w = 0; w < weeks; w++) {
    const bucketStart = addDays(start, w * 7);
    const bucketEnd = addDays(bucketStart, 6);

    const inflow = invoices
      .filter((i) => {
        const d = new Date(i.dueDate);
        return d >= bucketStart && d <= bucketEnd;
      })
      .reduce((acc, i) => acc + (i.paid ?? 0), 0);

    const outflow = supplierBills
      .filter((b) => {
        const d = new Date(b.dueDate);
        return d >= bucketStart && d <= bucketEnd;
      })
      .reduce((acc, b) => acc + b.amount, 0);

    buckets.push({
      start: bucketStart,
      end: bucketEnd,
      label: `${formatGreekShort(bucketStart)}`,
      inflow,
      outflow
    });
  }

  return buckets;
}

export function CashFlowChart({ weeks = 4 }: { weeks?: number }) {
  const buckets = React.useMemo(() => buildCashFlowBuckets(weeks), [weeks]);

  const data = buckets.map((b, idx) => ({
    name: `W${idx + 1}`,
    xLabel: b.label,
    inflow: b.inflow,
    outflow: b.outflow,
    net: b.inflow - b.outflow
  }));

  return (
    <div style={{ width: "100%", height: "100%", minWidth: 0, minHeight: 0 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
          barCategoryGap={14}
          barGap={6}
        >
          <defs>
            <linearGradient id="grad-inflow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(59,130,246,0.95)" />
              <stop offset="100%" stopColor="rgba(59,130,246,0.18)" />
            </linearGradient>
            <linearGradient id="grad-outflow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(217,119,6,0.95)" />
              <stop offset="100%" stopColor="rgba(217,119,6,0.18)" />
            </linearGradient>
            <linearGradient id="grad-net" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(22,163,74,0.35)" />
              <stop offset="100%" stopColor="rgba(22,163,74,0.06)" />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="rgba(226, 232, 240, 0.9)"
            strokeDasharray="3 3"
            strokeWidth={1}
          />

          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ top: 2, right: 0, paddingLeft: 8 }}
          />

          <ReferenceLine y={0} stroke="rgba(148, 163, 184, 0.75)" strokeDasharray="2 2" strokeWidth={1} />
          <XAxis
            dataKey="xLabel"
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            interval={0}
            tickMargin={8}
          />
          <YAxis
            width={52}
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => {
              const num = Number(v);
              const abs = Math.abs(num);
              const sign = num < 0 ? "-" : "";
              if (abs >= 1000) return `${sign}${Math.round(abs / 1000)}k`;
              return `${sign}${Math.round(abs)}`;
            }}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.05)"
            }}
            labelStyle={{ color: "#0f172a", fontWeight: 700 }}
            itemStyle={{ color: "#0f172a" }}
            formatter={(value: unknown, name: unknown) => [formatCurrency(Number(value)), String(name)]}
            labelFormatter={(label: unknown) => String(label)}
          />

          <Bar
            dataKey="inflow"
            name="Εισροές"
            fill="url(#grad-inflow)"
            radius={[10, 10, 0, 0]}
            barSize={24}
          />
          <Bar
            dataKey="outflow"
            name="Εκροές"
            fill="url(#grad-outflow)"
            radius={[10, 10, 0, 0]}
            barSize={24}
          />

          {/* Net as an area for stronger “cashflow” readability */}
          <Area
            type="monotone"
            dataKey="net"
            name="Net"
            stroke="#16a34a"
            strokeWidth={2}
            fill="url(#grad-net)"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

