import React from "react";
import { Outlet } from "react-router-dom";
import { FinanceSubnav } from "../../shell/FinanceSubnav";
import { DateRangeSwitcher } from "../../shell/DateRangeSwitcher";

export function SpendLayout() {
  return (
    <div>
      <header className="finance-section-header">
        <div className="finance-section-header__left">
          <span className="finance-section-header__title">Δαπάνες</span>
          <FinanceSubnav
            items={[
              { label: "Αιτήματα", to: "/finance/spend/requests" },
              { label: "Λογαριασμοί", to: "/finance/spend/bills" },
              { label: "Ουρά πληρωμών", to: "/finance/spend/payments" }
            ]}
          />
        </div>
        <DateRangeSwitcher />
      </header>
      <Outlet />
    </div>
  );
}

