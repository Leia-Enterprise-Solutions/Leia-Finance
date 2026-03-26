import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { KpiCard } from "../../ui/KpiCard";
import { Chip } from "../../ui/Chip";
import { formatCurrency, formatInt, formatCurrencyCompact } from "../../domain/format";
import { budgetLines } from "../../mock/data";
import type { InvoiceStatus } from "../../domain/types";
import { InvoicedVsCollectedChart } from "./charts/InvoicedVsCollectedChart";
import { CashFlowChart } from "./charts/CashFlowChart";
import { ExpensesBySupplierPieChart } from "./charts/ExpensesBySupplierPieChart";
import { AgingSnapshot } from "./widgets/AgingSnapshot";
import { OverviewActionStrip } from "./widgets/OverviewActionStrip";
import { OverviewDomainPanel } from "./widgets/OverviewDomainPanel";
import { useFinancePrototypeState } from "../../state/FinancePrototypeState";

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { invoices, paymentsQueue, receivables, supplierBills, auditEvents } = useFinancePrototypeState();

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
  const blockedPayCount = supplierBills.filter((b) => b.status === "Blocked").length;
  const blockedPayAmount = sum(supplierBills.filter((b) => b.status === "Blocked").map((b) => b.amount));
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
      id: "ar_due",
      label: dueSoonRecCount === 0 ? "0 λήγουν" : `${formatInt(dueSoonRecCount)} λήγουν`,
      chip: "απαιτήσεις",
      ctaTo: "/finance/revenue/collections?signal=Due%20Soon"
    },
    {
      id: "ap",
      label: overduePayCount === 0 ? "0 ληξιπρ." : `${formatInt(overduePayCount)} ληξιπρ.`,
      chip: "υποχρ.",
      ctaTo: "/finance/spend/bills?status=Overdue"
    },
    {
      id: "ap_blk",
      label:
        blockedPayCount === 0
          ? "0 μπλοκ."
          : `${formatInt(blockedPayCount)} μπλοκ. · ${formatCurrencyCompact(blockedPayAmount)}`,
      chip: "υποχρ.",
      ctaTo: "/finance/spend/bills?status=Blocked"
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

  const recentAuditItems = React.useMemo(() => {
    return auditEvents
      .slice()
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, 4);
  }, []);

  function severityTone(sev: "Info" | "Warning" | "Exception") {
    if (sev === "Exception") return "danger";
    if (sev === "Warning") return "warning";
    return "neutral";
  }

  function sourceModuleForTarget(target: string) {
    if (target.startsWith("drf_")) return "Drafts";
    if (target.startsWith("inv_")) return "Invoices / Receivables";
    if (target.startsWith("pr_")) return "Purchase Requests";
    if (target.startsWith("sb_")) return "Supplier Bills";
    if (target.startsWith("pay_")) return "Payments Queue";
    if (target.startsWith("bud_")) return "Budget";
    if (target.startsWith("emp_")) return "Employee Costs";
    return "—";
  }

  function toneForInvoiceStatus(s: InvoiceStatus) {
    if (s === "Paid") return "success";
    if (s === "Overdue") return "danger";
    if (s === "Partially Paid") return "warning";
    return "neutral";
  }

  const previewInvoices = React.useMemo(() => {
    const weight: Record<InvoiceStatus, number> = {
      Draft: 5,
      Issued: 2,
      "Partially Paid": 1,
      Paid: 3,
      Overdue: 0,
      Cancelled: 4
    };
    return invoices
      .slice()
      .sort((a, b) => weight[a.status] - weight[b.status] || a.dueDate.localeCompare(b.dueDate))
      .slice(0, 4);
  }, []);

  const invoicesAttentionStatus: InvoiceStatus = React.useMemo(() => {
    if (invoices.some((i) => i.status === "Overdue")) return "Overdue";
    if (invoices.some((i) => i.status === "Partially Paid")) return "Partially Paid";
    return "Issued";
  }, []);

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
            ctaLabel="Προβολή απαιτήσεων"
            ctaTo="/finance/revenue/collections"
          >
            <AgingSnapshot kind="receivables" compact />
          </OverviewDomainPanel>
          <OverviewDomainPanel
            title="Υποχρεώσεις"
            totalLabel="Σύνολο ανοικτών"
            totalValue={formatCurrency(outPayables)}
            sublabel={paySublabel}
            ctaLabel="Προβολή υποχρεώσεων"
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

      {/* 4-up row: need action + trends + expenses */}
      <div className="grid-4 overview-fourup overview-section">
        <Card title="Χρειάζονται ενέργεια">
          <OverviewActionStrip items={actionStripItems} />
        </Card>

        <Card title="Ταμειακή ροή">
          <CashFlowChart />
        </Card>

        <Card title="Εκδόσεις vs Εισπράξεις">
          <InvoicedVsCollectedChart />
        </Card>

        <Card title="Έξοδα ανά προμηθευτή">
          <ExpensesBySupplierPieChart />
        </Card>
      </div>

      {/* Zone 6 — Control / activity preview (compact) */}
      <section className=" overview-section overview-section--compact" aria-labelledby="overview-control-heading">
 
        <div className="grid-2">
          <Card
            title="Audit Trail / Activity Log"
            right={
              <Link to="/finance/control/audit" className="btn btn--sm">
                Προβολή όλων
              </Link>
            }
          >
            <div style={{ overflow: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Χρόνος</th>
                    <th>Χρήστης</th>
                    <th>Ενέργεια</th>
                    <th>Ενότητα</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAuditItems.map((e) => (
                    <tr
                      key={e.id}
                      onClick={() => navigate(`/finance/control/audit?q=${encodeURIComponent(e.target)}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <td className="muted">{new Date(e.at).toISOString().replace("T", " ").slice(0, 16)}</td>
                      <td>
                        <div className="row" style={{ gap: 8 }}>
                          <Chip tone={severityTone(e.severity)}>{e.severity}</Chip>
                          <span>{e.actor}</span>
                        </div>
                      </td>
                      <td className="muted">{e.action}</td>
                      <td className="muted">{sourceModuleForTarget(e.target)}</td>
                    </tr>
                  ))}
                  {recentAuditItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="muted" style={{ padding: 16 }}>
                        No audit events in mock data.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>

          <Card
            title="Invoices (preview)"
            right={
              <Link
                to={`/finance/revenue/invoices?status=${encodeURIComponent(invoicesAttentionStatus)}`}
                className="btn btn--sm"
              >
                Προβολή όλων
              </Link>
            }
          >
            <div style={{ overflow: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Τιμολόγιο</th>
                    <th>Πελάτης</th>
                    <th>Κατάσταση</th>
                    <th>Λήξη</th>
                    <th className="num">Υπόλοιπο</th>
                  </tr>
                </thead>
                <tbody>
                  {previewInvoices.map((inv) => {
                    const outstanding = Math.max(0, inv.total - inv.paid);
                    return (
                      <tr
                        key={inv.id}
                        onClick={() => navigate(`/finance/revenue/invoices/${encodeURIComponent(inv.id)}`)}
                        style={{
                          cursor: "pointer",
                          background:
                            inv.status === "Overdue"
                              ? "rgba(220, 38, 38, 0.05)"
                              : inv.status === "Partially Paid"
                                ? "rgba(245, 158, 11, 0.05)"
                                : undefined
                        }}
                      >
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{inv.number}</td>
                        <td>{inv.client}</td>
                        <td>
                          <Chip tone={toneForInvoiceStatus(inv.status)}>{inv.status}</Chip>
                        </td>
                        <td className="muted">{inv.dueDate}</td>
                        <td className="num">{formatCurrency(outstanding, inv.currency)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
