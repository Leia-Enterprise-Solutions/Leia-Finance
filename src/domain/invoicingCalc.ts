import type { DraftLine } from "./types";

export type VatCategory = NonNullable<DraftLine["vatCategory"]>;

export const VAT_RATES: Record<VatCategory, number> = {
  "Standard 24%": 0.24,
  "Reduced 13%": 0.13,
  "Super Reduced 6%": 0.06,
  "Zero 0%": 0,
  Exempt: 0,
  "Reverse charge": 0
};

export function clampPct(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

export function normalizeDraftLine(l: DraftLine): DraftLine {
  const qty = Number.isFinite(l.quantity) ? (l.quantity as number) : 1;
  const unitPrice = Number.isFinite(l.unitPrice)
    ? (l.unitPrice as number)
    : Number.isFinite(l.amount)
      ? l.amount
      : 0;
  const discountPct = Number.isFinite(l.discountPct) ? clampPct(l.discountPct as number) : 0;
  const vatCategory = ((l.vatCategory ?? "Standard 24%") as VatCategory) ?? "Standard 24%";
  const unit = l.unit ?? "ea";
  const next: DraftLine = { ...l, quantity: qty, unitPrice, discountPct, vatCategory, unit };
  // Keep `amount` aligned to computed net for consistency.
  return { ...next, amount: computeLineNet(next) };
}

export function vatRateFor(category: VatCategory) {
  return VAT_RATES[category] ?? VAT_RATES["Standard 24%"];
}

export function computeLineNet(l: DraftLine) {
  const qty = Number.isFinite(l.quantity) ? (l.quantity as number) : 1;
  const unitPrice = Number.isFinite(l.unitPrice)
    ? (l.unitPrice as number)
    : Number.isFinite(l.amount)
      ? l.amount
      : 0;
  const discountPct = clampPct(Number.isFinite(l.discountPct) ? (l.discountPct as number) : 0);
  const net = qty * unitPrice * (1 - discountPct / 100);
  return Number.isFinite(net) ? net : 0;
}

export function computeLineVat(l: DraftLine) {
  const cat = (l.vatCategory ?? "Standard 24%") as VatCategory;
  return computeLineNet(l) * vatRateFor(cat);
}

export type InvoiceTotals = {
  totalPreDiscount: number;
  totalDiscount: number;
  totalNet: number;
  totalVat: number;
  totalOtherTaxes: number;
  grandTotal: number;
};

export function computeInvoiceTotals(lines: DraftLine[]): InvoiceTotals {
  const normalized = lines.map(normalizeDraftLine);
  const totalNet = normalized.reduce((a, l) => a + computeLineNet(l), 0);
  const totalVat = normalized.reduce((a, l) => a + computeLineVat(l), 0);
  const totalOtherTaxes = normalized.reduce((a, l) => a + (Number.isFinite(l.otherTaxesAmount) ? (l.otherTaxesAmount as number) : 0), 0);
  const totalPreDiscount = normalized.reduce((a, l) => {
    const qty = Number.isFinite(l.quantity) ? (l.quantity as number) : 1;
    const unitPrice = Number.isFinite(l.unitPrice)
      ? (l.unitPrice as number)
      : Number.isFinite(l.amount)
        ? l.amount
        : 0;
    const v = qty * unitPrice;
    return a + (Number.isFinite(v) ? v : 0);
  }, 0);
  const totalDiscount = Math.max(0, totalPreDiscount - totalNet);
  const grandTotal = totalNet + totalOtherTaxes + totalVat;
  return {
    totalPreDiscount,
    totalDiscount,
    totalNet,
    totalVat,
    totalOtherTaxes,
    grandTotal
  };
}

