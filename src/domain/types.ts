export type InvoiceStatus =
  | "Draft"
  | "Issued"
  | "Partially Paid"
  | "Paid"
  | "Overdue"
  | "Cancelled";

export type TransmissionStatus = "Not Required" | "Pending" | "Accepted" | "Rejected";

export type CollectionSignal = "Not Due" | "Due Soon" | "Overdue";

export type PurchaseRequestStatus =
  | "Open"
  | "Needs Changes"
  | "Rejected"
  | "Approved / Committed";

export type SupplierBillStatus = "Open" | "Ready" | "Blocked" | "Scheduled" | "Paid" | "Overdue";

export type BudgetSignal = "Healthy" | "Warning" | "Breach";

export type Invoice = {
  id: string;
  number: string;
  client: string;
  project?: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  total: number;
  paid: number;
  status: InvoiceStatus;
  transmission: TransmissionStatus;
  owner: string;
};

export type InvoiceDraft = {
  id: string;
  client: string;
  project?: string;
  updatedAt: string;
  currency: string;
  draftTotal: number;
  reservedLines: number;
  status: "In Progress" | "Stale" | "Ready to Issue";
};

export type ReceivableWorkItem = {
  invoiceId: string;
  invoiceNumber: string;
  client: string;
  dueDate: string;
  outstanding: number;
  currency: string;
  signal: CollectionSignal;
  owner: string;
  nextAction?: string;
};

export type PurchaseRequest = {
  id: string;
  title: string;
  requester: string;
  department: string;
  supplier?: string;
  createdAt: string;
  amount: number;
  currency: string;
  urgency: "Normal" | "Urgent";
  status: PurchaseRequestStatus;
  attachments: number;
};

export type SupplierBill = {
  id: string;
  supplier: string;
  receivedAt: string;
  dueDate: string;
  amount: number;
  currency: string;
  status: SupplierBillStatus;
  linkedRequestId?: string;
  match: "Matched" | "Mismatch" | "Unlinked";
  blockedReason?: string;
};

export type PaymentQueueItem = {
  id: string;
  supplierBillId: string;
  supplier: string;
  dueDate: string;
  amount: number;
  currency: string;
  readiness: "Ready" | "Blocked";
  status: "Prepared" | "Scheduled" | "Executed";
  blockedReason?: string;
};

export type BillableWorkStatus = "Available" | "Reserved" | "Invoiced" | "Non-billable";

export type BillableWorkItem = {
  id: string;
  client: string;
  project?: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: BillableWorkStatus;
  reservedByDraftId?: string;
  invoicedByInvoiceId?: string;
};

export type DraftLine = {
  id: string;
  sourceId: string;
  description: string;
  amount: number;
  currency: string;
};

export type BudgetLine = {
  id: string;
  department: string;
  category: string;
  period: string;
  currency: string;
  budgeted: number;
  committed: number;
  actualPaid: number;
  signal: BudgetSignal;
};

export type EmployeeCostRow = {
  id: string;
  employee: string;
  team: string;
  period: string;
  currency: string;
  totalCost: number;
  billablePct: number;
  nonBillablePct: number;
};

export type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  summary: string;
  severity: "Info" | "Warning" | "Exception";
};

