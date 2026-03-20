import React from "react";
import { DateRangeProvider } from "./dateRange";
import { PermissionsProvider } from "./permissions";
import { FinancePrototypeStateProvider } from "./FinancePrototypeState";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <PermissionsProvider>
      <DateRangeProvider>
        <FinancePrototypeStateProvider>{children}</FinancePrototypeStateProvider>
      </DateRangeProvider>
    </PermissionsProvider>
  );
}

