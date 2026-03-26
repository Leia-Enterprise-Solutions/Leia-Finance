import React from "react";
import { Link, Outlet } from "react-router-dom";
import { FinanceSubnav } from "../../shell/FinanceSubnav";
import { DateRangeSwitcher } from "../../shell/DateRangeSwitcher";

export function OverviewLayout() {
  const getActive = (item: { to: string }, location: { search: string }) => {
    const tabParam = "tab";
    const current = new URLSearchParams(location.search).get(tabParam) || "home";
    if (item.to.includes("tab=alerts")) return current === "alerts";
    if (item.to.includes("tab=activity")) return current === "activity";
    return current === "home";
  };

  return (
    <div>
      <header className="finance-section-header">
        <div className="finance-section-header__left">
          <span className="finance-section-header__title">Πίνακας Επισκόπησης</span>
          <FinanceSubnav
            getActive={getActive}
            items={[
              { label: "Πίνακας", to: "/finance/overview" },
              { label: "Ειδοποιήσεις / Εξαιρέσεις", to: "/finance/overview?tab=alerts" },
              { label: "Πρόσφατη δραστηριότητα", to: "/finance/overview?tab=activity" }
            ]}
          />
        </div>
        <div className="finance-section-header__right">
          <DateRangeSwitcher />
          <div className="finance-overview-actions">
            <Link to="/finance/revenue/invoices" className="btn overview-action overview-action--secondary">
              Προβολή Τιμολογίων
            </Link>
            <Link to="/finance/spend/payments" className="btn primary overview-action overview-action--primary">
              Προβολή Εκκρεμών Πληρωμών
            </Link>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

