import React from "react";
import { DateRangeProvider } from "./dateRange";
import { PermissionsProvider } from "./permissions";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <PermissionsProvider>
      <DateRangeProvider>{children}</DateRangeProvider>
    </PermissionsProvider>
  );
}

