import React from "react";
import { computePreset } from "./dateRangePresets";
import type { DateRangePreset, DateRangeState } from "./dateRangeTypes";

type DateRangeContextValue = {
  range: DateRangeState;
  setPreset: (preset: DateRangePreset) => void;
  setCustomRange: (start: Date, end: Date) => void;
};

const DateRangeContext = React.createContext<DateRangeContextValue | null>(null);

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPreset] = React.useState<DateRangePreset>("month");
  const initial = React.useMemo(() => computePreset("month"), []);
  const [customStart, setCustomStart] = React.useState<Date>(() => initial.start);
  const [customEnd, setCustomEnd] = React.useState<Date>(() => initial.end);

  const range = React.useMemo(() => {
    if (preset !== "custom") return computePreset(preset);
    const base = computePreset("custom");
    return {
      ...base,
      start: customStart,
      end: customEnd
    };
  }, [preset, customStart, customEnd]);

  const setCustomRange = React.useCallback((start: Date, end: Date) => {
    setCustomStart(start);
    setCustomEnd(end);
    setPreset("custom");
  }, []);

  const value = React.useMemo(() => ({ range, setPreset, setCustomRange }), [range, setCustomRange]);
  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}

export function useDateRange() {
  const ctx = React.useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used within DateRangeProvider");
  return ctx;
}

