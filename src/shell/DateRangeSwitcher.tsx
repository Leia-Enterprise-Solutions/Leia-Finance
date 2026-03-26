import React from "react";
import { useDateRange } from "../state/dateRange";
import type { DateRangePreset } from "../state/dateRangeTypes";

const OPTIONS: { id: DateRangePreset; label: string }[] = [
  { id: "month", label: "Μήνας" },
  { id: "last_month", label: "Τελευταίος μήνας" },
  { id: "ytd", label: "YTD" },
  { id: "lytd", label: "LYTD" }
];

function toYmd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function parseYmd(s: string) {
  // Interpret as local day start.
  const [y, m, d] = s.split("-").map((x) => Number(x));
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function DateRangeSwitcher() {
  const { range, setPreset, setCustomRange } = useDateRange();
  const [customOpen, setCustomOpen] = React.useState(false);
  const [customFrom, setCustomFrom] = React.useState(() => toYmd(range.start));
  const [customTo, setCustomTo] = React.useState(() => toYmd(range.end));
  const [customError, setCustomError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (range.preset !== "custom") return;
    setCustomFrom(toYmd(range.start));
    setCustomTo(toYmd(range.end));
  }, [range.preset, range.start, range.end]);

  return (
    <div className="date-range-switcher row" aria-label="Εύρος ημερομηνιών">
      <label className="date-range-switcher__label" htmlFor="date-range-preset">
        Περίοδος
      </label>
      <select
        id="date-range-preset"
        className="select date-range-switcher__select"
        value={range.preset}
        onChange={(e) => {
          const next = e.target.value as DateRangePreset;
          setPreset(next);
          if (next === "custom") {
            setCustomFrom(toYmd(range.start));
            setCustomTo(toYmd(range.end));
            setCustomError(null);
            setCustomOpen(true);
          } else {
            setCustomOpen(false);
          }
        }}
      >
        {OPTIONS.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
        <option value="custom">Προσαρμοσμένο…</option>
      </select>

      {customOpen ? (
        <div className="popover">
          <div className="popover-panel" style={{ marginTop: 6 }}>
            <div className="row" style={{ alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
              <div className="field" style={{ minWidth: 180 }}>
                <label>Από</label>
                <input
                  className="input"
                  type="date"
                  value={customFrom}
                  onChange={(e) => {
                    setCustomFrom(e.target.value);
                    setCustomError(null);
                  }}
                />
              </div>
              <div className="field" style={{ minWidth: 180 }}>
                <label>Έως</label>
                <input
                  className="input"
                  type="date"
                  value={customTo}
                  onChange={(e) => {
                    setCustomTo(e.target.value);
                    setCustomError(null);
                  }}
                />
              </div>
              <div className="row" style={{ gap: 8, marginLeft: "auto" }}>
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={() => {
                    setCustomOpen(false);
                    setCustomError(null);
                    if (range.preset === "custom") {
                      setCustomFrom(toYmd(range.start));
                      setCustomTo(toYmd(range.end));
                    }
                  }}
                >
                  Ακύρωση
                </button>
                <button
                  type="button"
                  className="btn primary btn--sm"
                  onClick={() => {
                    if (!customFrom || !customTo) return;
                    const start = parseYmd(customFrom);
                    const end = endOfDay(parseYmd(customTo));
                    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
                      setCustomError("Μη έγκυρες ημερομηνίες.");
                      return;
                    }
                    if (end < start) {
                      setCustomError("Η ημερομηνία «Έως» πρέπει να είναι μετά το «Από».");
                      return;
                    }
                    setCustomRange(start, end);
                    setCustomOpen(false);
                    setCustomError(null);
                  }}
                  disabled={!customFrom || !customTo}
                >
                  Εφαρμογή
                </button>
              </div>
            </div>

            {customError ? (
              <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                {customError}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

