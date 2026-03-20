import React from "react";
import { useDateRange } from "../state/dateRange";
import type { DateRangePreset } from "../state/dateRangeTypes";

const OPTIONS: { id: DateRangePreset; label: string }[] = [
  { id: "month", label: "Μήνας" },
  { id: "last_month", label: "Τελευταίος μήνας" },
  { id: "ytd", label: "YTD" },
  { id: "lytd", label: "LYTD" }
];

export function DateRangeSwitcher() {
  const { range, setPreset } = useDateRange();

  return (
    <div className="date-range-switcher row" aria-label="Εύρος ημερομηνιών">
      <label className="date-range-switcher__label" htmlFor="date-range-preset">
        Περίοδος
      </label>
      <select
        id="date-range-preset"
        className="select date-range-switcher__select"
        value={range.preset}
        onChange={(e) => setPreset(e.target.value as DateRangePreset)}
      >
        {OPTIONS.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

