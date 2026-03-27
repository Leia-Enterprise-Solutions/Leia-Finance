import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { KpiCard } from "../../ui/KpiCard";
import { Chip } from "../../ui/Chip";
import { formatCurrency, formatInt, formatCurrencyCompact } from "../../domain/format";
import { budgetLines } from "../../mock/data";
import type { InvoiceStatus } from "../../domain/types";
import type { DateRangePreset } from "../../state/dateRangeTypes";
import { computePreset } from "../../state/dateRangePresets";
import { InvoicedVsCollectedChart } from "./charts/InvoicedVsCollectedChart";
import { CashFlowChart } from "./charts/CashFlowChart";
import { ExpensesBySupplierPieChart } from "./charts/ExpensesBySupplierPieChart";
import { AgingSnapshot } from "./widgets/AgingSnapshot";
import { OverviewDomainPanel } from "./widgets/OverviewDomainPanel";
import { useFinancePrototypeState } from "../../state/FinancePrototypeState";
import { CriticalPointsPanel } from "./widgets/CriticalPointsPanel";
import { DocumentsPreview, type DocumentPreviewRow } from "./widgets/DocumentsPreview";

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { invoices, paymentsQueue, receivables, supplierBills, auditEvents } = useFinancePrototypeState();
  const [cashflowRangeMonths, setCashflowRangeMonths] = React.useState<3 | 6 | 12>(6);
  const [receivablesRangePreset, setReceivablesRangePreset] = React.useState<DateRangePreset>("month");
  const [payablesRangePreset, setPayablesRangePreset] = React.useState<DateRangePreset>("month");

  function ymdToLocalStart(ymd: string) {
    // Interpret YYYY-MM-DD as local day start to match date pickers.
    const [y, m, d] = ymd.split("-").map((x) => Number(x));
    return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
  }

  const receivablesRange = React.useMemo(() => computePreset(receivablesRangePreset), [receivablesRangePreset]);
  const payablesRange = React.useMemo(() => computePreset(payablesRangePreset), [payablesRangePreset]);

  const receivablesInRange = React.useMemo(() => {
    const start = receivablesRange.start.getTime();
    const end = receivablesRange.end.getTime();
    return receivables.filter((r) => {
      const t = ymdToLocalStart(r.dueDate).getTime();
      return Number.isFinite(t) && t >= start && t <= end;
    });
  }, [receivables, receivablesRange.start, receivablesRange.end]);

  const payablesInRange = React.useMemo(() => {
    const start = payablesRange.start.getTime();
    const end = payablesRange.end.getTime();
    return supplierBills.filter((b) => {
      const t = ymdToLocalStart(b.dueDate).getTime();
      return Number.isFinite(t) && t >= start && t <= end;
    });
  }, [supplierBills, payablesRange.start, payablesRange.end]);

  const grossInvoiced = sum(invoices.map((i) => i.total));
  const collected = sum(invoices.map((i) => i.paid));
  const expensesPaid = sum(
    supplierBills.filter((b) => b.status === "Paid").map((b) => b.amount)
  );
  const netCash = collected - expensesPaid;
  const outReceivables = sum(receivablesInRange.map((r) => r.outstanding));
  const outPayables = sum(payablesInRange.filter((b) => b.status !== "Paid").map((b) => b.amount));
  const committedSpend = sum(budgetLines.map((b) => b.committed));
  const overdueRecCount = receivablesInRange.filter((r) => r.signal === "Overdue").length;
  const dueSoonRecCount = receivablesInRange.filter((r) => r.signal === "Due Soon").length;
  const notDueRecCount = receivablesInRange.filter((r) => r.signal === "Not Due").length;
  const overduePayCount = payablesInRange.filter((b) => b.status === "Overdue").length;
  const blockedPayCount = payablesInRange.filter((b) => b.status === "Blocked").length;
  const blockedPayAmount = sum(payablesInRange.filter((b) => b.status === "Blocked").map((b) => b.amount));
  const blockedPayments = paymentsQueue.filter((p) => p.readiness === "Blocked").length;
  const payReady = payablesInRange.filter((b) => b.status === "Ready").length;
  const payBlocked = payablesInRange.filter((b) => b.status === "Blocked").length;

  // —— Zone 2: 4 premium summary widgets (strongest emphasis)
  const topWidgets = [
    {
      key: "gross",
      label: "Μικτές Εκδόσεις",
      value: formatCurrency(grossInvoiced),
      sub: "σύνολο τιμολογίων (μικτό)",
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
      label: "Πληρωμένες Δαπάνες (μικτές)",
      value: formatCurrency(expensesPaid),
      sub: "εκτελεσμένες πληρωμές",
      to: "/finance/spend/payments?status=Executed",
      iconClass: "bi-bank",
      currentValue: expensesPaid,
      trendPreference: "lower" as const
    },
    {
      key: "net",
      label: "Καθαρή μεταβολή ταμείου",
      value: formatCurrency(netCash),
      sub: "εισροές - εκροές (λειτουργικό)",
      iconClass: "bi-graph-up-arrow",
      currentValue: netCash,
      trendPreference: "higher" as const
    }
  ];

  // —— Zone 3: Operational status panels (receivables + payables)
  const recSublabel = `${formatInt(receivablesInRange.length)} ανοικτές · Μη ληξιπρ. ${notDueRecCount} · Σύντομα ${dueSoonRecCount} · Ληξιπρ. ${overdueRecCount}`;
  const paySublabel = `Έτοιμες ${payReady} · Μπλοκ. ${payBlocked} · Ληξιπρ. ${overduePayCount}`;

  const criticalRisks = [
    {
      id: "risk_ar_overdue",
      title: "Ληξιπρόθεσμες Απαιτήσεις",
      subtitle: "Κίνδυνος καθυστέρησης είσπραξης",
      value: `${formatInt(overdueRecCount)}`,
      tone: "danger" as const,
      icon: "bi-exclamation-octagon",
      to: "/finance/revenue/collections?signal=Overdue"
    },
    {
      id: "risk_ap_overdue",
      title: "Ληξιπρόθεσμες Υποχρεώσεις",
      subtitle: "Κίνδυνος καθυστέρησης πληρωμής",
      value: `${formatInt(overduePayCount)}`,
      tone: "danger" as const,
      icon: "bi-bank",
      to: "/finance/spend/bills?status=Overdue"
    },
    {
      id: "risk_ap_blocked",
      title: "Μπλοκαρισμένες Υποχρεώσεις",
      subtitle: "Απαιτείται επίλυση πριν την πληρωμή",
      value:
        blockedPayCount === 0
          ? "0"
          : `${formatInt(blockedPayCount)} · ${formatCurrencyCompact(blockedPayAmount)}`,
      tone: "warning" as const,
      icon: "bi-slash-circle",
      to: "/finance/spend/bills?status=Blocked"
    }
  ].filter((x) => x.value !== "0");

  const criticalNextSteps = [
    {
      id: "next_ar_due",
      title: "Απαιτήσεις που λήγουν σύντομα",
      subtitle: "Προτεραιότητα follow-up",
      value: `${formatInt(dueSoonRecCount)}`,
      tone: "warning" as const,
      icon: "bi-clock-history",
      to: "/finance/revenue/collections?signal=Due%20Soon"
    },
    {
      id: "next_payments_prep",
      title: "Πληρωμές σε προετοιμασία",
      subtitle: blockedPayments > 0 ? `${formatInt(blockedPayments)} μπλοκαρισμένες` : undefined,
      value: `${formatInt(paymentsQueue.length)}`,
      tone: blockedPayments > 0 ? ("warning" as const) : ("neutral" as const),
      icon: "bi-list-check",
      to: "/finance/spend/payments"
    }
  ].filter((x) => x.value !== "0");

  const [docsFilter, setDocsFilter] = React.useState<"All" | "OUT" | "IN">("All");

  function toneForSupplierBillStatus(s: string) {
    if (s === "Paid") return "success" as const;
    if (s === "Overdue") return "danger" as const;
    if (s === "Blocked") return "warning" as const;
    return "neutral" as const;
  }

  const documentsPreviewRows: DocumentPreviewRow[] = React.useMemo(() => {
    const rows: DocumentPreviewRow[] = [];

    for (const inv of invoices) {
      const outstanding = Math.max(0, inv.total - inv.paid);
      rows.push({
        id: inv.id,
        ref: inv.number,
        counterparty: inv.client,
        direction: "OUT",
        statusLabel: inv.status,
        statusTone: toneForInvoiceStatus(inv.status),
        dateLabel: inv.dueDate,
        amountLabel: formatCurrency(outstanding, inv.currency),
        to: `/finance/revenue/invoices/${encodeURIComponent(inv.id)}`
      });
    }

    for (const b of supplierBills) {
      rows.push({
        id: b.id,
        ref: b.id,
        counterparty: b.supplier,
        direction: "IN",
        statusLabel: b.status,
        statusTone: toneForSupplierBillStatus(b.status),
        dateLabel: b.dueDate,
        amountLabel: formatCurrency(b.amount, b.currency),
        to: `/finance/spend/bills/${encodeURIComponent(b.id)}`
      });
    }

    const score = (r: DocumentPreviewRow) => {
      const statusWeight =
        r.statusTone === "danger" ? 0 : r.statusTone === "warning" ? 1 : r.statusTone === "neutral" ? 2 : 3;
      return `${statusWeight}_${r.dateLabel}`;
    };

    return rows
      .slice()
      .sort((a, b) => score(a).localeCompare(score(b)))
      .slice(0, 10);
  }, [invoices, supplierBills]);

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
            headerRight={
              <select
                className="select overview-domain-panel__range"
                value={receivablesRangePreset}
                onChange={(e) => setReceivablesRangePreset(e.target.value as DateRangePreset)}
                aria-label="Περίοδος απαιτήσεων"
              >
                <option value="month">Μήνας</option>
                <option value="last_month">Τελευταίος μήνας</option>
                <option value="ytd">YTD</option>
                <option value="lytd">LYTD</option>
              </select>
            }
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
            headerRight={
              <select
                className="select overview-domain-panel__range"
                value={payablesRangePreset}
                onChange={(e) => setPayablesRangePreset(e.target.value as DateRangePreset)}
                aria-label="Περίοδος υποχρεώσεων"
              >
                <option value="month">Μήνας</option>
                <option value="last_month">Τελευταίος μήνας</option>
                <option value="ytd">YTD</option>
                <option value="lytd">LYTD</option>
              </select>
            }
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
        <Card title="Κρίσιμα Σημεία & Επόμενα Βήματα">
          <CriticalPointsPanel risks={criticalRisks} nextSteps={criticalNextSteps} />
        </Card>

        <Card
          title="Ταμειακή ροή"
          right={
            <select
              className="select"
              value={String(cashflowRangeMonths)}
              onChange={(e) => setCashflowRangeMonths(Number(e.target.value) as 3 | 6 | 12)}
              aria-label="Εύρος ταμειακής ροής"
            >
              <option value="3">3 μήνες</option>
              <option value="6">6 μήνες</option>
              <option value="12">12 μήνες</option>
            </select>
          }
        >
          <CashFlowChart months={cashflowRangeMonths} />
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
              <Link
                to="/finance/control/audit"
                className="btn btn--sm"
                aria-label="Προβολή όλων"
                title="Προβολή όλων"
              >
                <i className="bi bi-eye" aria-hidden="true" />
              </Link>
            }
          >
            <div className="finance-table-wrap">
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
                      className="finance-table-clickrow"
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
            title="Παραστατικά / Τιμολόγια"
          >
            <DocumentsPreview rows={documentsPreviewRows} filter={docsFilter} onFilterChange={setDocsFilter} />
          </Card>
        </div>
      </section>
    </>
  );
}
