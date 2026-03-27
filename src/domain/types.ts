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
  | "Draft"
  | "Submitted"
  | "Returned for Changes"
  | "Rejected"
  | "Approved (Committed)"
  | "Cancelled";

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
  owner: string;
  updatedAt: string;
  currency: string;
  draftTotal: number;
  reservedLines: number;
  status: "In Progress" | "Stale" | "Ready to Issue" | "Issued";

  // Builder-level invoice header fields (prototype-persisted)
  documentType?: string;
  paymentWay?: string;
  billingEntity?: string;
  contractRef?: string;
  customerReference?: string;
  subject?: string;
  issueDate?: string; // YYYY-MM-DD
  paymentTerms?: "Net 15" | "Net 30" | "Net 45";
  dueDate?: string; // YYYY-MM-DD
  externalNote?: string;
  internalNote?: string;
  series?: string;
  invoiceNumber?: string;

  relatedDocument?: {
    enabled?: boolean;
    reference?: string;
    number?: string;
    mark?: string;
    note?: string;
  };

  movement?: {
    purpose?: string;
    loadingPlace?: string;
    deliveryPlace?: string;
    transportMode?: string;
    carrier?: string;
    recipientThirdParty?: string;
  };
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

export type BillingType = "Hourly" | "Fixed";

export type BillableWorkItem = {
  id: string;
  client: string;
  project?: string;
  date: string;
  description: string;
  billingType: BillingType;
  /** For Hourly */
  hours?: number;
  rate?: number;
  /** Amount is the operational billing amount used in drafts/invoices. */
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
  /** Net value (pre-VAT) used for prototype totals. Prefer computed from qty/unitPrice/discount. */
  amount: number;
  currency: string;

  // Official-practical line fields (prototype-persisted)
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  discountPct?: number; // 0..100
  vatCategory?: "Standard 24%" | "Reduced 13%" | "Super Reduced 6%" | "Zero 0%" | "Exempt" | "Reverse charge";

  // Draft-facing income classification helpers (prototype-persisted)
  st9IncomeCategory?: string; // Κατηγορία Εσόδων (ΣΤ.9)
  e3IncomeClassification?: string; // Χαρακτηρισμός Ε3 (compact selection)

  // Conditional fields (only when triggered)
  vatExemptionReason?: string;
  reverseChargeNote?: string;
  withholdingPct?: number;
  stampDutyPct?: number;
  otherTaxesAmount?: number;

  // Advanced / special-case fields (available, not always visible)
  lineComment?: string;
  incomeClassification?: string;
  expenseClassification?: string;
  specialUnitCode?: string;
  mydataExtra?: Record<string, string>;
};

export type BudgetLine = {
  id: string;
  department: string;
  category: string;
  project?: string;
  task?: string;
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
  project?: string;
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

