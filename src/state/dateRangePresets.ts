import type { DateRangePreset, DateRangeState } from "./dateRangeTypes";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function computePreset(preset: DateRangePreset, now = new Date()): DateRangeState {
  const today = startOfDay(now);
  switch (preset) {
    case "month": {
      const start = startOfMonth(today);
      const end = endOfDay(endOfMonth(today));
      return { preset, label: "Τρέχων μήνας", start, end };
    }
    case "last_month": {
      const prev = new Date(today);
      prev.setMonth(prev.getMonth() - 1);
      const start = startOfMonth(prev);
      const end = endOfDay(endOfMonth(prev));
      return { preset, label: "Προηγούμενος μήνας", start, end };
    }
    case "ytd": {
      const start = new Date(today.getFullYear(), 0, 1);
      const end = endOfDay(today);
      return { preset, label: "Έτος έως σήμερα", start, end };
    }
    case "lytd": {
      const start = new Date(today.getFullYear() - 1, 0, 1);
      const end = endOfDay(new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()));
      return { preset, label: "Πέρσι έως σήμερα", start, end };
    }
    case "custom": {
      // The concrete dates come from DateRangeProvider.
      // Fallback keeps range valid even before user applies.
      const start = startOfMonth(today);
      const end = endOfDay(endOfMonth(today));
      return { preset, label: "Προσαρμοσμένο", start, end };
    }
  }
}

