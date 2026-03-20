import React from "react";
import { Outlet } from "react-router-dom";
import { FinanceSubnav } from "../../shell/FinanceSubnav";
import { DateRangeSwitcher } from "../../shell/DateRangeSwitcher";

export function RevenueLayout() {
  return (
    <div>
      <header className="finance-section-header">
        <div className="finance-section-header__left">
          <span className="finance-section-header__title">Έσοδα</span>
          <FinanceSubnav
            items={[
              { label: "Αρχική", to: "/finance/revenue" },
              { label: "Πρόχειρα", to: "/finance/revenue/drafts" },
              { label: "Τιμολόγια", to: "/finance/revenue/invoices" },
              { label: "Εισπράξεις", to: "/finance/revenue/collections" }
            ]}
          />
        </div>
        <DateRangeSwitcher />
      </header>
      <Outlet />
    </div>
  );
}

