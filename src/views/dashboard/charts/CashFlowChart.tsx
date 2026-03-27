import React from "react";
import {
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
import { useFinancePrototypeState } from "../../../state/FinancePrototypeState";

type MonthBucket = {
  label: string;
  fullLabel: string;
  inflow: number;
  outflow: number;
};

function startOfMonth(d: Date) {
  const date = new Date(d);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addMonths(d: Date, months: number) {
  const date = new Date(d);
  date.setMonth(date.getMonth() + months);
  return date;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatGreekMonth(d: Date) {
  return d.toLocaleDateString("el-GR", { month: "short" });
}

function formatGreekMonthYear(d: Date) {
  return d.toLocaleDateString("el-GR", { month: "short", year: "numeric" });
}

function buildCashFlowBuckets(
  months: number,
  invoices: { dueDate: string; paid?: number }[],
  supplierBills: { dueDate: string; amount: number }[]
): MonthBucket[] {
  const invoiceDates = invoices.map((i) => new Date(i.dueDate));
  const billDates = supplierBills.map((b) => new Date(b.dueDate));
  const allDates = [...invoiceDates, ...billDates].filter((d) => !Number.isNaN(d.getTime()));

  if (allDates.length === 0) {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const firstMonth = addMonths(monthStart, -(months - 1));
    return Array.from({ length: months }, (_, idx) => {
      const bucketMonth = addMonths(firstMonth, idx);
      return {
        label: formatGreekMonth(bucketMonth),
        fullLabel: formatGreekMonthYear(bucketMonth),
        inflow: 0,
        outflow: 0
      };
    });
  }

  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
  const lastMonthStart = startOfMonth(maxDate);
  const firstMonth = addMonths(lastMonthStart, -(months - 1));

  const inflowByMonth = new Map<string, number>();
  const outflowByMonth = new Map<string, number>();

  for (const i of invoices) {
    const d = new Date(i.dueDate);
    if (Number.isNaN(d.getTime())) continue;
    const key = monthKey(d);
    inflowByMonth.set(key, (inflowByMonth.get(key) ?? 0) + (i.paid ?? 0));
  }

  for (const b of supplierBills) {
    const d = new Date(b.dueDate);
    if (Number.isNaN(d.getTime())) continue;
    const key = monthKey(d);
    outflowByMonth.set(key, (outflowByMonth.get(key) ?? 0) + b.amount);
  }

  const buckets: MonthBucket[] = [];
  for (let m = 0; m < months; m++) {
    const bucketMonth = addMonths(firstMonth, m);
    const key = monthKey(bucketMonth);
    buckets.push({
      label: formatGreekMonth(bucketMonth),
      fullLabel: formatGreekMonthYear(bucketMonth),
      inflow: inflowByMonth.get(key) ?? 0,
      outflow: outflowByMonth.get(key) ?? 0
    });
  }

  return buckets;
}

type CashflowTooltipPayload = {
  payload?: { periodLabel?: string; inflow?: number; outflow?: number; net?: number };
};

type ActiveBarShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

function CapBar({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fill,
  capColor,
  capAt
}: ActiveBarShapeProps & { fill: string; capColor: string; capAt: "top" | "bottom" }) {
  const y2 = y + height;
  const barTop = Math.min(y, y2);
  const barBottom = Math.max(y, y2);
  const capY = capAt === "top" ? barTop : barBottom;

  return (
    <g>
      <rect x={x} y={barTop} width={width} height={Math.abs(height)} fill={fill} />
      <line x1={x} y1={capY} x2={x + width} y2={capY} stroke={capColor} strokeWidth={1.2} />
    </g>
  );
}

type CashflowTooltipProps = {
  active?: boolean;
  payload?: CashflowTooltipPayload[];
};

function CashflowTooltip({ active, payload }: CashflowTooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.98)",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        boxShadow: "0 10px 26px rgba(15, 23, 42, 0.1)",
        padding: "10px 12px",
        minWidth: 168
      }}
    >
      <div style={{ display: "grid", gap: 4, fontSize: 12, color: "#334155", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "#4f7cff", display: "inline-block" }} />
            In
          </span>
          <strong style={{ color: "#0f172a", fontWeight: 700 }}>{formatCurrency(point.inflow ?? 0)}</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "#8b5cf6", display: "inline-block" }} />
            Out
          </span>
          <strong style={{ color: "#0f172a", fontWeight: 700 }}>{formatCurrency(point.outflow ?? 0)}</strong>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#64748b", borderTop: "1px solid #eef2ff", paddingTop: 6 }}>
        {point.periodLabel} · Καθαρό {formatCurrency(point.net ?? 0)}
      </div>
    </div>
  );
}

export function CashFlowChart({ months = 6 }: { months?: number }) {
  const { invoices, supplierBills } = useFinancePrototypeState();
  const buckets = React.useMemo(() => buildCashFlowBuckets(months, invoices, supplierBills), [months, invoices, supplierBills]);

  const data = buckets.map((b) => ({
    xLabel: b.label,
    periodLabel: b.fullLabel,
    inflow: b.inflow,
    outflow: b.outflow,
    outflowNegative: -b.outflow,
    net: b.inflow - b.outflow
  }));
  const maxAbs = data.reduce((acc, d) => Math.max(acc, Math.abs(d.inflow), Math.abs(d.outflowNegative)), 0);
  const yBound = maxAbs <= 0 ? 1000 : Math.ceil(maxAbs / 1000) * 1000;

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
              <stop offset="0%" stopColor="rgba(79,124,255,0.48)" />
              <stop offset="100%" stopColor="rgba(79,124,255,0.06)" />
            </linearGradient>
            <linearGradient id="grad-outflow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(139,92,246,0.08)" />
              <stop offset="100%" stopColor="rgba(139,92,246,0.42)" />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="rgba(226, 232, 240, 0.75)"
            strokeDasharray="2 4"
            strokeWidth={1}
          />

          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ top: 2, right: 0, paddingLeft: 8, fontSize: 12 }}
            formatter={(value: string) => (value === "Εισροές" ? "In" : "Out")}
          />

          <ReferenceLine y={0} stroke="rgba(100, 116, 139, 0.95)" strokeDasharray="4 4" strokeWidth={1.1} />
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
              if (abs >= 1000) return `${sign}$${Math.round(abs / 1000)}K`;
              return `${sign}$${Math.round(abs)}`;
            }}
            allowDecimals={false}
            domain={[-yBound, yBound]}
          />
          <Tooltip
            cursor={{ fill: "rgba(15, 23, 42, 0.03)" }}
            content={<CashflowTooltip />}
          />

          <Bar
            dataKey="inflow"
            name="Εισροές"
            fill="url(#grad-inflow)"
            radius={0}
            barSize={18}
            shape={<CapBar fill="url(#grad-inflow)" capColor="rgba(58,94,236,0.9)" capAt="top" />}
            activeBar={<CapBar fill="rgba(79,124,255,0.62)" capColor="rgba(58,94,236,0.98)" capAt="top" />}
          />
          <Bar
            dataKey="outflowNegative"
            name="Εκροές"
            fill="url(#grad-outflow)"
            radius={0}
            barSize={18}
            shape={<CapBar fill="url(#grad-outflow)" capColor="rgba(109,40,217,0.9)" capAt="bottom" />}
            activeBar={<CapBar fill="rgba(139,92,246,0.56)" capColor="rgba(109,40,217,0.98)" capAt="bottom" />}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

