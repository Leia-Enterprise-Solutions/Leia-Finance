import React from "react";
import { computePreset } from "./dateRangePresets";
import type { DateRangePreset, DateRangeState } from "./dateRangeTypes";

type DateRangeContextValue = {
  range: DateRangeState;
  setPreset: (preset: DateRangePreset) => void;
};

const DateRangeContext = React.createContext<DateRangeContextValue | null>(null);

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPreset] = React.useState<DateRangePreset>("month");
  const range = React.useMemo(() => computePreset(preset), [preset]);
  const value = React.useMemo(() => ({ range, setPreset }), [range]);
  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}

export function useDateRange() {
  const ctx = React.useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used within DateRangeProvider");
  return ctx;
}

