export type DateRangePreset = "month" | "quarter" | "ytd" | "lytd";

export type DateRangeState = {
  preset: DateRangePreset;
  label: string;
  start: Date;
  end: Date;
};

