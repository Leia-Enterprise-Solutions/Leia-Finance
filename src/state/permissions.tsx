import React from "react";

export type Role = "Finance Operator" | "Manager" | "Viewer";

export type Permissions = {
  role: Role;
  canApproveRequest: boolean;
  canIssueInvoice: boolean;
  canRegisterReceipt: boolean;
  canSchedulePayment: boolean;
  canRecordSupplierBill: boolean;
};

const PermissionsContext = React.createContext<Permissions | null>(null);

function permsForRole(role: Role): Permissions {
  switch (role) {
    case "Manager":
      return {
        role,
        canApproveRequest: true,
        canIssueInvoice: true,
        canRegisterReceipt: true,
        canSchedulePayment: true,
        canRecordSupplierBill: true
      };
    case "Finance Operator":
      return {
        role,
        canApproveRequest: true,
        canIssueInvoice: true,
        canRegisterReceipt: true,
        canSchedulePayment: true,
        canRecordSupplierBill: true
      };
    case "Viewer":
      return {
        role,
        canApproveRequest: false,
        canIssueInvoice: false,
        canRegisterReceipt: false,
        canSchedulePayment: false,
        canRecordSupplierBill: false
      };
  }
}

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  // v1 UI prototype: default operator; later comes auth/roles.
  const [role] = React.useState<Role>("Finance Operator");
  const value = React.useMemo(() => permsForRole(role), [role]);
  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions() {
  const ctx = React.useContext(PermissionsContext);
  if (!ctx) throw new Error("usePermissions must be used within PermissionsProvider");
  return ctx;
}

