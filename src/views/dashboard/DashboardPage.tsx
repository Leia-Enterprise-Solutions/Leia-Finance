import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { KpiCard } from "../../ui/KpiCard";
import { formatCurrency, formatInt, formatCurrencyCompact } from "../../domain/format";
import { invoices, paymentsQueue, receivables, supplierBills, budgetLines } from "../../mock/data";
import { InvoicedVsCollectedChart } from "./charts/InvoicedVsCollectedChart";
import { CommittedVsActualChart } from "./charts/CommittedVsActualChart";
import { ExpensesBySupplierPieChart } from "./charts/ExpensesBySupplierPieChart";
import { AgingSnapshot } from "./widgets/AgingSnapshot";
import { OverviewActionStrip } from "./widgets/OverviewActionStrip";
import { OverviewDomainPanel } from "./widgets/OverviewDomainPanel";

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}

export function DashboardPage() {
  const navigate = useNavigate();

  const grossInvoiced = sum(invoices.map((i) => i.total));
  const collected = sum(invoices.map((i) => i.paid));
  const expensesPaid = sum(
    supplierBills.filter((b) => b.status === "Paid").map((b) => b.amount)
  );
  const netCash = collected - expensesPaid;
  const outReceivables = sum(receivables.map((r) => r.outstanding));
  const outPayables = sum(
    supplierBills.filter((b) => b.status !== "Paid").map((b) => b.amount)
  );
  const committedSpend = sum(budgetLines.map((b) => b.committed));
  const overdueRecCount = receivables.filter((r) => r.signal === "Overdue").length;
  const dueSoonRecCount = receivables.filter((r) => r.signal === "Due Soon").length;
  const notDueRecCount = receivables.filter((r) => r.signal === "Not Due").length;
  const overduePayCount = supplierBills.filter((b) => b.status === "Overdue").length;
  const blockedPayments = paymentsQueue.filter((p) => p.readiness === "Blocked").length;
  const payReady = supplierBills.filter((b) => b.status === "Ready").length;
  const payBlocked = supplierBills.filter((b) => b.status === "Blocked").length;

  // —— Zone 2: 4 premium summary widgets (strongest emphasis)
  const topWidgets = [
    {
      key: "gross",
      label: "Εκδοθέντα",
      value: formatCurrency(grossInvoiced),
      sub: "vs προηγ. περίοδο",
      to: "/finance/revenue/invoices?status=Issued",
      iconClass: "bi-send",
      currentValue: grossInvoiced,
      trendPreference: "higher" as const
    },
    {
      key: "collected",
      label: "Εισπραχθέντα",
      value: formatCurrency(collected),
      sub: "καταγρ. εισπράξεις",
      to: "/finance/revenue/collections",
      iconClass: "bi-wallet2",
      currentValue: collected,
      trendPreference: "higher" as const
    },
    {
      key: "expenses",
      label: "Πληρωμένες δαπάνες",
      value: formatCurrency(expensesPaid),
      sub: "vs προηγ. περίοδο",
      to: "/finance/spend/payments?status=Executed",
      iconClass: "bi-bank",
      currentValue: expensesPaid,
      trendPreference: "lower" as const
    },
    {
      key: "net",
      label: "Καθαρή μεταβολή ταμείου",
      value: formatCurrency(netCash),
      sub: "cash in - cash out",
      iconClass: "bi-graph-up-arrow",
      currentValue: netCash,
      trendPreference: "higher" as const
    }
  ];

  // —— Zone 3: Operational status panels (receivables + payables)
  const recSublabel = `${formatInt(receivables.length)} ανοικτές · Μη ληξιπρ. ${notDueRecCount} · Σύντομα ${dueSoonRecCount} · Ληξιπρ. ${overdueRecCount}`;
  const paySublabel = `Έτοιμες ${payReady} · Μπλοκ. ${payBlocked} · Ληξιπρ. ${overduePayCount}`;

  // —— Zone 4: Needs attention strip
  const actionStripItems = [
    {
      id: "ar",
      label: overdueRecCount === 0 ? "0 ληξιπρ." : `${formatInt(overdueRecCount)} ληξιπρ.`,
      chip: "απαιτήσεις",
      ctaTo: "/finance/revenue/collections?signal=Overdue"
    },
    {
      id: "ap",
      label: overduePayCount === 0 ? "0 ληξιπρ." : `${formatInt(overduePayCount)} ληξιπρ.`,
      chip: "υποχρ.",
      ctaTo: "/finance/spend/bills?status=Overdue"
    },
    {
      id: "pq",
      label: `${formatInt(paymentsQueue.length)} σε προετ.${blockedPayments > 0 ? ` · ${formatInt(blockedPayments)} μπλοκ.` : ""}`,
      chip: "πληρωμές",
      ctaTo: "/finance/spend/payments"
    },
    {
      id: "co",
      label: `${formatCurrencyCompact(committedSpend)} δεσμεύσεις`,
      chip: "budget",
      ctaTo: "/finance/control/budgets"
    }
  ];

  // —— Zone 6: Mock counts for control preview (no backend)
  const budgetWarningCount = 0;
  const auditExceptionCount = 0;
  const recentActivityCount = 8;

  return (
    <>
      {/* Zone 2 — Top summary: 4 premium widgets */}
      <section className="overview-section overview-section--top" aria-labelledby="overview-summary-heading">
        <h2 id="overview-summary-heading" className="overview-section__title">
          Σύνοψη περιόδου
        </h2>
        <div className="overview-top-widgets">
          {topWidgets.map((w) => (
            <KpiCard
              key={w.key}
              label={w.label}
              value={w.value}
              sub={w.sub}
              iconClass={w.iconClass}
              currentValue={w.currentValue}
              trendPreference={w.trendPreference}
              onClick={w.to ? () => navigate(w.to) : undefined}
            />
          ))}
        </div>
      </section>

      {/* Zone 3 — Operational status: 2 panels */}
      <section className="overview-section" aria-labelledby="overview-status-heading">
        <h2 id="overview-status-heading" className="overview-section__title">
          Κατάσταση απαιτήσεων & υποχρεώσεων
        </h2>
        <div className="grid-2">
          <OverviewDomainPanel
            title="Απαιτήσεις"
            totalLabel="Σύνολο ανοικτών"
            totalValue={formatCurrency(outReceivables)}
            sublabel={recSublabel}
            ctaLabel="Εισπράξεις"
            ctaTo="/finance/revenue/collections"
          >
            <AgingSnapshot kind="receivables" compact />
          </OverviewDomainPanel>
          <OverviewDomainPanel
            title="Υποχρεώσεις"
            totalLabel="Σύνολο ανοικτών"
            totalValue={formatCurrency(outPayables)}
            sublabel={paySublabel}
            ctaLabel="Ουρά"
            ctaTo="/finance/spend/payments"
          >
            <AgingSnapshot kind="payables" compact />
            <div className="overview-domain-panel__supporting">
              <span>Πληρωμές σε προετοιμασία: {formatInt(paymentsQueue.length)}</span>
              <span>Δεσμεύσεις: {formatCurrency(committedSpend)}</span>
            </div>
          </OverviewDomainPanel>
        </div>
      </section>

      {/* Zone 4 — Needs attention */}
      <section className="overview-section overview-section--attention" aria-labelledby="overview-attention-heading">
        <h2 id="overview-attention-heading" className="overview-section__title">
          Χρειάζονται ενέργεια
        </h2>
        <OverviewActionStrip items={actionStripItems} />
      </section>

      {/* Zone 5 — Trends (2 charts, quieter) */}
      <section className="overview-section overview-section--trends" aria-labelledby="overview-trends-heading">
        <h2 id="overview-trends-heading" className="overview-section__title">
          Τάσεις
        </h2>
        <div className="grid-2">
          <Card title="Εκδόσεις vs Εισπράξεις">
            <InvoicedVsCollectedChart />
          </Card>
          <Card title="Δεσμευμένα vs Πληρωθέντα">
            <CommittedVsActualChart />
          </Card>
        </div>
      </section>

      {/* Zone 5b — Secondary analytics */}
      <section className="overview-section overview-section--secondary" aria-labelledby="overview-secondary-heading">
        <h2 id="overview-secondary-heading" className="overview-section__title overview-section__title--muted">
          Λοιπές αναλύσεις
        </h2>
        <Card title="Έξοδα ανά προμηθευτή">
          <ExpensesBySupplierPieChart />
        </Card>
      </section>

      {/* Zone 6 — Control / activity preview (compact) */}
      <section className="overview-section overview-section--compact" aria-labelledby="overview-control-heading">
        <div className="overview-control-preview">
          <h2 id="overview-control-heading" className="overview-section__title overview-section__title--muted">
            Έλεγχος & δραστηριότητα
          </h2>
          <div className="overview-control-preview__stats">
            <span className="overview-control-preview__stat">Προειδοποιήσεις budget: {formatInt(budgetWarningCount)}</span>
            <span className="overview-control-preview__stat">Εξαιρέσεις audit: {formatInt(auditExceptionCount)}</span>
            <span className="overview-control-preview__stat">Πρόσφατη δραστηριότητα: {formatInt(recentActivityCount)}</span>
          </div>
          <Link to="/finance/overview?tab=activity" className="btn btn--sm ghost">
            Προβολή όλων
          </Link>
        </div>
      </section>
    </>
  );
}
