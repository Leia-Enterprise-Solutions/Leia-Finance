import React from "react";
import { Outlet } from "react-router-dom";
import { FinanceSubnav } from "../../shell/FinanceSubnav";
import { DateRangeSwitcher } from "../../shell/DateRangeSwitcher";

export function SpendLayout() {
  return (
    <div>
      <header className="finance-section-header">
        <div className="finance-section-header__left">
          <span className="finance-section-header__title">Κύκλος Δαπανών / Υποχρεώσεων</span>
          <FinanceSubnav
            items={[
              { label: "Αιτήματα Αγοράς", to: "/finance/spend/requests" },
              { label: "Τιμολόγια Προμηθευτών", to: "/finance/spend/bills" },
              { label: "Ουρά Πληρωμών", to: "/finance/spend/payments" }
            ]}
          />
        </div>
        <DateRangeSwitcher />
      </header>
      <Outlet />
    </div>
  );
}

