export function formatCurrency(amount: number, currency: string = "EUR") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/** Compact form for overview/summary: e.g. 13400 → "13,4k €" */
export function formatCurrencyCompact(amount: number, currency: string = "EUR") {
  if (Math.abs(amount) >= 1000) {
    const k = amount / 1000;
    const s = Math.abs(k) >= 10 ? Math.round(k).toString() : k.toFixed(1).replace(".", ",");
    return `${s}k ${currency}`;
  }
  return formatCurrency(amount, currency);
}

export function formatInt(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function daysBetween(now: Date, then: Date) {
  const ms = now.getTime() - then.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

