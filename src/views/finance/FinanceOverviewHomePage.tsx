import React from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardPage } from "../dashboard/DashboardPage";
import { OverviewAlertsTab } from "../overview/OverviewAlertsTab";
import { OverviewActivityTab } from "../overview/OverviewActivityTab";

const TAB_PARAM = "tab";

export function FinanceOverviewHomePage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get(TAB_PARAM) || "home";

  if (tab === "alerts") return <OverviewAlertsTab />;
  if (tab === "activity") return <OverviewActivityTab />;
  return <DashboardPage />;
}

