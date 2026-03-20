import React from "react";
import { useDateRange } from "../state/dateRange";

type TrendPreference = "higher" | "lower";

type KpiCardProps = {
  label: string;
  value: React.ReactNode;
  sub: string;
  iconClass: string;
  onClick?: () => void;
  currentValue: number;
  trendPreference?: TrendPreference;
  referenceBias?: number;
};

const PRESET_CHANGE: Record<ReturnType<typeof useDateRange>["range"]["preset"], number> = {
  month: -0.06,
  quarter: -0.03,
  ytd: 0.02,
  lytd: 0.04
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function buildReferenceValue(currentValue: number, presetChange: number, referenceBias: number) {
  const adjustedChange = clamp(presetChange + referenceBias, -0.35, 0.35);
  return currentValue / (1 + adjustedChange);
}

function getTrend(currentValue: number, referenceValue: number, preference: TrendPreference) {
  if (!Number.isFinite(referenceValue) || referenceValue === 0) {
    return { arrow: "→", deltaText: "0.0%", tone: "neutral" as const };
  }

  const deltaPct = ((currentValue - referenceValue) / Math.abs(referenceValue)) * 100;
  const isFlat = Math.abs(deltaPct) < 0.1;
  if (isFlat) return { arrow: "→", deltaText: "0.0%", tone: "neutral" as const };

  const isUp = deltaPct > 0;
  const isGood = preference === "higher" ? isUp : !isUp;
  return {
    arrow: isUp ? "↑" : "↓",
    deltaText: `${Math.abs(deltaPct).toFixed(1)}%`,
    tone: isGood ? ("positive" as const) : ("negative" as const)
  };
}

export function KpiCard({
  label,
  value,
  sub,
  iconClass,
  onClick,
  currentValue,
  trendPreference = "higher",
  referenceBias = 0
}: KpiCardProps) {
  const { range } = useDateRange();
  const reference = buildReferenceValue(currentValue, PRESET_CHANGE[range.preset], referenceBias);
  const trend = getTrend(currentValue, reference, trendPreference);

  const clickable = typeof onClick === "function";

  return (
    <div
      className={clickable ? "kpi" : "kpi kpi--static"}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
    >
      <div className="label">
        <span>{label}</span>
        <span className="kpi-icon" aria-hidden="true">
          <i className={`bi ${iconClass}`} />
        </span>
      </div>
      <div className="value">{value}</div>
      <div className="sub">
        <span className={`kpi-trend kpi-trend--${trend.tone}`}>
          {trend.arrow} {trend.deltaText}
        </span>
        <span>{sub}</span>
      </div>
    </div>
  );
}

