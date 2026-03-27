import React from "react";
import { Outlet } from "react-router-dom";
import { FinanceSubnav } from "../../shell/FinanceSubnav";

export function RevenueLayout() {
  return (
    <div>
      <header className="finance-section-header">
        <div className="finance-section-header__left">
          <span className="finance-section-header__title">Κύκλος Εσόδων / Απαιτήσεων</span>
          <FinanceSubnav
            items={[
              { label: "Πρόχειρα Τιμολογίου", to: "/finance/revenue/drafts" },
              { label: "Τιμολόγια", to: "/finance/revenue/invoices" },
              { label: "Απαιτήσεις (Εισπράξεις)", to: "/finance/revenue/collections" }
            ]}
          />
        </div>
      </header>
      <Outlet />
    </div>
  );
}

