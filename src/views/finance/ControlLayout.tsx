import React from "react";
import { Outlet } from "react-router-dom";
import { FinanceSubnav } from "../../shell/FinanceSubnav";
import { DateRangeSwitcher } from "../../shell/DateRangeSwitcher";

export function ControlLayout() {
  return (
    <div>
      <header className="finance-section-header">
        <div className="finance-section-header__left">
          <span className="finance-section-header__title">Υποστηρικτικό επίπεδο ελέγχου</span>
          <FinanceSubnav
            items={[
              { label: "Αρχική", to: "/finance/control" },
              { label: "Προϋπολογισμοί", to: "/finance/control/budgets" },
              { label: "Κόστος Προσωπικού", to: "/finance/control/employee-costs" },
              { label: "Audit Trail", to: "/finance/control/audit" }
            ]}
          />
        </div>
        <DateRangeSwitcher />
      </header>
      <Outlet />
    </div>
  );
}

