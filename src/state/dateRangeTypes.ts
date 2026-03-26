export type DateRangePreset = "month" | "last_month" | "ytd" | "lytd" | "custom";

export type DateRangeState = {
  preset: DateRangePreset;
  label: string;
  start: Date;
  end: Date;
};

