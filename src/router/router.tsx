import React from "react";
import { createBrowserRouter, Navigate, useLocation, useParams } from "react-router-dom";
import { AppShell } from "../shell/AppShell";
import { InvoicesPage } from "../views/invoices/InvoicesPage";
import { InvoiceDetailPage } from "../views/invoices/InvoiceDetailPage";
import { DraftsPage } from "../views/drafts/DraftsPage";
import { InvoiceDraftBuilderPage } from "../views/drafts/InvoiceDraftBuilderPage";
import { CollectionsPage } from "../views/collections/CollectionsPage";
import { PurchaseRequestsPage } from "../views/purchase/PurchaseRequestsPage";
import { PurchaseRequestDetailPage } from "../views/purchase/PurchaseRequestDetailPage";
import { SupplierBillsPage } from "../views/payables/SupplierBillsPage";
import { SupplierBillDetailPage } from "../views/payables/SupplierBillDetailPage";
import { PaymentsQueuePage } from "../views/payables/PaymentsQueuePage";
import { BudgetOverviewPage } from "../views/budgets/BudgetOverviewPage";
import { EmployeeCostPage } from "../views/costs/EmployeeCostPage";
import { AuditTrailPage } from "../views/audit/AuditTrailPage";
import { AppProviders } from "../state/AppProviders";
import { FinanceLauncherPage } from "../views/finance/FinanceLauncherPage";
import { FinanceOverviewHomePage } from "../views/finance/FinanceOverviewHomePage";
import { ControlHomePage } from "../views/finance/ControlHomePage";
import { OverviewLayout } from "../views/finance/OverviewLayout";
import { RevenueLayout } from "../views/finance/RevenueLayout";
import { SpendLayout } from "../views/finance/SpendLayout";
import { ControlLayout } from "../views/finance/ControlLayout";

function PreserveSearchNavigate({ to }: { to: string }) {
  const loc = useLocation();
  return <Navigate to={{ pathname: to, search: loc.search }} replace />;
}

function PreserveSearchParamNavigate({
  to
}: {
  to: (params: Record<string, string | undefined>) => string;
}) {
  const loc = useLocation();
  const params = useParams();
  return <Navigate to={{ pathname: to(params), search: loc.search }} replace />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AppProviders>
        <AppShell />
      </AppProviders>
    ),
    children: [
      { index: true, element: <Navigate to="/finance" replace /> },

      // Canonical Finance IA
      {
        path: "finance",
        children: [
          { index: true, element: <FinanceLauncherPage /> },
          {
            path: "overview",
            element: <OverviewLayout />,
            children: [
              { index: true, element: <FinanceOverviewHomePage /> },
              { path: "alerts", element: <Navigate to="/finance/overview?tab=alerts" replace /> },
              { path: "activity", element: <Navigate to="/finance/overview?tab=activity" replace /> }
            ]
          },
          {
            path: "revenue",
            element: <RevenueLayout />,
            children: [
              { index: true, element: <Navigate to="/finance/revenue/drafts" replace /> },
              { path: "drafts", element: <DraftsPage /> },
              { path: "drafts/builder", element: <InvoiceDraftBuilderPage /> },
              { path: "drafts/:draftId/builder", element: <InvoiceDraftBuilderPage /> },
              { path: "invoices", element: <InvoicesPage /> },
              { path: "invoices/:invoiceId", element: <InvoiceDetailPage /> },
              { path: "collections", element: <CollectionsPage /> }
            ]
          },
          {
            path: "spend",
            element: <SpendLayout />,
            children: [
              { index: true, element: <Navigate to="/finance/spend/requests" replace /> },
              { path: "requests", element: <PurchaseRequestsPage /> },
              { path: "requests/:requestId", element: <PurchaseRequestDetailPage /> },
              { path: "bills", element: <SupplierBillsPage /> },
              { path: "bills/:billId", element: <SupplierBillDetailPage /> },
              { path: "payments", element: <PaymentsQueuePage /> }
            ]
          },
          {
            path: "control",
            element: <ControlLayout />,
            children: [
              { index: true, element: <ControlHomePage /> },
              { path: "budgets", element: <BudgetOverviewPage /> },
              { path: "employee-costs", element: <EmployeeCostPage /> },
              { path: "audit", element: <AuditTrailPage /> }
            ]
          }
        ]
      },

      // Backward-compatible routes (redirect to canonical, preserving query string)
      { path: "dashboard", element: <PreserveSearchNavigate to="/finance/overview" /> },
      { path: "invoices", element: <PreserveSearchNavigate to="/finance/revenue/invoices" /> },
      {
        path: "invoices/:invoiceId",
        element: (
          <PreserveSearchParamNavigate
            to={(p) => `/finance/revenue/invoices/${encodeURIComponent(p.invoiceId ?? "")}`}
          />
        )
      },
      { path: "drafts", element: <PreserveSearchNavigate to="/finance/revenue/drafts" /> },
      { path: "drafts/builder", element: <PreserveSearchNavigate to="/finance/revenue/drafts/builder" /> },
      {
        path: "drafts/:draftId/builder",
        element: (
          <PreserveSearchParamNavigate
            to={(p) => `/finance/revenue/drafts/${encodeURIComponent(p.draftId ?? "")}/builder`}
          />
        )
      },
      { path: "collections", element: <PreserveSearchNavigate to="/finance/revenue/collections" /> },
      { path: "purchase-requests", element: <PreserveSearchNavigate to="/finance/spend/requests" /> },
      {
        path: "purchase-requests/:requestId",
        element: (
          <PreserveSearchParamNavigate
            to={(p) => `/finance/spend/requests/${encodeURIComponent(p.requestId ?? "")}`}
          />
        )
      },
      { path: "supplier-bills", element: <PreserveSearchNavigate to="/finance/spend/bills" /> },
      {
        path: "supplier-bills/:billId",
        element: (
          <PreserveSearchParamNavigate
            to={(p) => `/finance/spend/bills/${encodeURIComponent(p.billId ?? "")}`}
          />
        )
      },
      { path: "payments", element: <PreserveSearchNavigate to="/finance/spend/payments" /> },
      { path: "budgets", element: <PreserveSearchNavigate to="/finance/control/budgets" /> },
      { path: "employee-costs", element: <PreserveSearchNavigate to="/finance/control/employee-costs" /> },
      { path: "audit", element: <PreserveSearchNavigate to="/finance/control/audit" /> }
    ]
  }
]);

