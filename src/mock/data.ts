import type {
  AuditEvent,
  BudgetLine,
  DraftLine,
  BillableWorkItem,
  EmployeeCostRow,
  Invoice,
  InvoiceDraft,
  PaymentQueueItem,
  PurchaseRequest,
  ReceivableWorkItem,
  SupplierBill
} from "../domain/types";

export const invoices: Invoice[] = [
  {
    id: "inv_1001",
    number: "INV-2026-01001",
    client: "Northwind Labs",
    project: "Retainer",
    issueDate: "2026-03-02",
    dueDate: "2026-03-17",
    currency: "EUR",
    total: 18250,
    paid: 0,
    status: "Overdue",
    transmission: "Accepted",
    owner: "Alex"
  },
  {
    id: "inv_1002",
    number: "INV-2026-01002",
    client: "Acme Holding",
    project: "Implementation",
    issueDate: "2026-03-05",
    dueDate: "2026-04-04",
    currency: "EUR",
    total: 24500,
    paid: 12000,
    status: "Partially Paid",
    transmission: "Accepted",
    owner: "Iris"
  },
  {
    id: "inv_1003",
    number: "INV-2026-01003",
    client: "Globex",
    project: "Discovery",
    issueDate: "2026-02-12",
    dueDate: "2026-03-14",
    currency: "EUR",
    total: 9600,
    paid: 9600,
    status: "Paid",
    transmission: "Accepted",
    owner: "Alex"
  },
  {
    id: "inv_1004",
    number: "INV-2026-01004",
    client: "Umbrella",
    project: "Support",
    issueDate: "2026-03-09",
    dueDate: "2026-03-29",
    currency: "EUR",
    total: 7800,
    paid: 0,
    status: "Issued",
    transmission: "Pending",
    owner: "Mina"
  }
];

export const invoiceDrafts: InvoiceDraft[] = [
  {
    id: "drf_2001",
    client: "Northwind Labs",
    project: "Retainer",
    owner: "Alex",
    updatedAt: "2026-03-16T14:20:00Z",
    currency: "EUR",
    draftTotal: 11250,
    reservedLines: 18,
    status: "Ready to Issue"
  },
  {
    id: "drf_2002",
    client: "Globex",
    project: "Change request",
    owner: "Iris",
    updatedAt: "2026-03-03T11:00:00Z",
    currency: "EUR",
    draftTotal: 3200,
    reservedLines: 6,
    status: "Stale"
  },
  {
    id: "drf_2003",
    client: "Acme Holding",
    project: "Implementation",
    owner: "Mina",
    updatedAt: "2026-03-18T09:42:00Z",
    currency: "EUR",
    draftTotal: 8900,
    reservedLines: 9,
    status: "In Progress"
  }
];

export const receivables: ReceivableWorkItem[] = [
  {
    invoiceId: "inv_1001",
    invoiceNumber: "INV-2026-01001",
    client: "Northwind Labs",
    dueDate: "2026-03-17",
    outstanding: 18250,
    currency: "EUR",
    signal: "Overdue",
    owner: "Alex",
    nextAction: "Call AP owner; confirm payment date"
  },
  {
    invoiceId: "inv_1002",
    invoiceNumber: "INV-2026-01002",
    client: "Acme Holding",
    dueDate: "2026-04-04",
    outstanding: 12500,
    currency: "EUR",
    signal: "Not Due",
    owner: "Iris"
  },
  {
    invoiceId: "inv_1004",
    invoiceNumber: "INV-2026-01004",
    client: "Umbrella",
    dueDate: "2026-03-29",
    outstanding: 7800,
    currency: "EUR",
    signal: "Due Soon",
    owner: "Mina",
    nextAction: "Send reminder on 2026-03-25"
  }
];

export const purchaseRequests: PurchaseRequest[] = [
  {
    id: "pr_3001",
    title: "Design subcontractor (March)",
    requester: "Nikos",
    department: "Product",
    supplier: "Studio Kappa",
    createdAt: "2026-03-06",
    amount: 4200,
    currency: "EUR",
    urgency: "Normal",
    status: "Approved (Committed)",
    attachments: 2
  },
  {
    id: "pr_3002",
    title: "New laptops (2)",
    requester: "Mina",
    department: "Operations",
    createdAt: "2026-03-10",
    amount: 2800,
    currency: "EUR",
    urgency: "Urgent",
    status: "Submitted",
    attachments: 1
  },
  {
    id: "pr_3003",
    title: "Legal review (contract update)",
    requester: "Alex",
    department: "Operations",
    supplier: "Lex & Co",
    createdAt: "2026-02-27",
    amount: 1600,
    currency: "EUR",
    urgency: "Normal",
    status: "Submitted",
    attachments: 0
  }
];

export const supplierBills: SupplierBill[] = [
  {
    id: "sb_4001",
    supplier: "Studio Kappa",
    receivedAt: "2026-03-12",
    dueDate: "2026-03-26",
    amount: 4200,
    currency: "EUR",
    status: "Ready",
    linkedRequestId: "pr_3001",
    match: "Matched"
  },
  {
    id: "sb_4002",
    supplier: "CloudTools Ltd",
    receivedAt: "2026-03-01",
    dueDate: "2026-03-15",
    amount: 990,
    currency: "EUR",
    status: "Overdue",
    match: "Unlinked",
    blockedReason: "Unlinked bill requires policy override"
  },
  {
    id: "sb_4003",
    supplier: "Lex & Co",
    receivedAt: "2026-03-08",
    dueDate: "2026-04-07",
    amount: 2100,
    currency: "EUR",
    status: "Blocked",
    linkedRequestId: "pr_3003",
    match: "Mismatch",
    blockedReason: "Mismatch vs approved request amount"
  }
];

export const paymentsQueue: PaymentQueueItem[] = [
  {
    id: "pay_5001",
    supplierBillId: "sb_4001",
    supplier: "Studio Kappa",
    dueDate: "2026-03-26",
    amount: 4200,
    currency: "EUR",
    readiness: "Ready",
    status: "Prepared"
  },
  {
    id: "pay_5002",
    supplierBillId: "sb_4002",
    supplier: "CloudTools Ltd",
    dueDate: "2026-03-15",
    amount: 990,
    currency: "EUR",
    readiness: "Blocked",
    status: "Prepared",
    blockedReason: "Unlinked payable"
  },
  {
    id: "pay_5003",
    supplierBillId: "sb_4003",
    supplier: "Lex & Co",
    dueDate: "2026-04-07",
    amount: 2100,
    currency: "EUR",
    readiness: "Blocked",
    status: "Prepared",
    blockedReason: "Mismatch / missing approval"
  }
];

export const billableWork: BillableWorkItem[] = [
  {
    id: "bw_9001",
    client: "Acme Holding",
    project: "Implementation",
    date: "2026-03-11",
    description: "Sprint delivery (week 10) – billable hours",
    amount: 3200,
    currency: "EUR",
    status: "Available"
  },
  {
    id: "bw_9002",
    client: "Acme Holding",
    project: "Implementation",
    date: "2026-03-12",
    description: "Integration support – billable hours",
    amount: 2100,
    currency: "EUR",
    status: "Reserved",
    reservedByDraftId: "drf_2003"
  },
  {
    id: "bw_9003",
    client: "Northwind Labs",
    project: "Retainer",
    date: "2026-03-04",
    description: "Monthly retainer line (March)",
    amount: 11250,
    currency: "EUR",
    status: "Reserved",
    reservedByDraftId: "drf_2001"
  },
  {
    id: "bw_9004",
    client: "Globex",
    project: "Discovery",
    date: "2026-02-10",
    description: "Discovery workshops – billable package",
    amount: 9600,
    currency: "EUR",
    status: "Invoiced",
    invoicedByInvoiceId: "inv_1003"
  },
  {
    id: "bw_9005",
    client: "Umbrella",
    project: "Support",
    date: "2026-03-07",
    description: "Support incident response – non-billable",
    amount: 0,
    currency: "EUR",
    status: "Non-billable"
  }
  ,
  {
    id: "bw_9011",
    client: "Northwind Labs",
    project: "Retainer",
    date: "2026-03-02",
    description: "Monthly retainer line (March) – billable hours",
    amount: 18250,
    currency: "EUR",
    status: "Invoiced",
    invoicedByInvoiceId: "inv_1001"
  },
  {
    id: "bw_9012",
    client: "Acme Holding",
    project: "Implementation",
    date: "2026-03-05",
    description: "Implementation milestones – billable hours",
    amount: 24500,
    currency: "EUR",
    status: "Invoiced",
    invoicedByInvoiceId: "inv_1002"
  },
  {
    id: "bw_9013",
    client: "Umbrella",
    project: "Support",
    date: "2026-03-09",
    description: "Support services – billable hours",
    amount: 7800,
    currency: "EUR",
    status: "Invoiced",
    invoicedByInvoiceId: "inv_1004"
  }
];

export const draftLinesByDraftId: Record<string, DraftLine[]> = {
  drf_2001: [
    {
      id: "dl_9101",
      sourceId: "bw_9003",
      description: "Monthly retainer line (March)",
      amount: 11250,
      currency: "EUR"
    }
  ],
  drf_2003: [
    {
      id: "dl_9102",
      sourceId: "bw_9002",
      description: "Integration support – billable hours",
      amount: 2100,
      currency: "EUR"
    }
  ]
};

export const budgetLines: BudgetLine[] = [
  {
    id: "bud_6001",
    department: "Operations",
    category: "Tools & SaaS",
    period: "2026-Q1",
    currency: "EUR",
    budgeted: 12000,
    committed: 7400,
    actualPaid: 6100,
    signal: "Warning"
  },
  {
    id: "bud_6002",
    department: "Product",
    category: "Contractors",
    period: "2026-Q1",
    currency: "EUR",
    budgeted: 18000,
    committed: 4200,
    actualPaid: 0,
    signal: "Healthy"
  },
  {
    id: "bud_6003",
    department: "Sales",
    category: "Travel",
    period: "2026-Q1",
    currency: "EUR",
    budgeted: 4000,
    committed: 1800,
    actualPaid: 4100,
    signal: "Breach"
  }
];

export const employeeCosts: EmployeeCostRow[] = [
  {
    id: "emp_7001",
    employee: "Alex",
    team: "Finance",
    period: "2026-03",
    currency: "EUR",
    totalCost: 5200,
    billablePct: 15,
    nonBillablePct: 85
  },
  {
    id: "emp_7002",
    employee: "Mina",
    team: "Operations",
    period: "2026-03",
    currency: "EUR",
    totalCost: 4800,
    billablePct: 0,
    nonBillablePct: 100
  },
  {
    id: "emp_7003",
    employee: "Iris",
    team: "Delivery",
    period: "2026-03",
    currency: "EUR",
    totalCost: 6100,
    billablePct: 70,
    nonBillablePct: 30
  }
];

export const auditEvents: AuditEvent[] = [
  {
    id: "log_8001",
    at: "2026-03-18T09:44:00Z",
    actor: "Iris",
    action: "draft saved",
    target: "drf_2003",
    summary: "Invoice draft updated (lines reserved: 9).",
    severity: "Info"
  },
  {
    id: "log_8002",
    at: "2026-03-16T14:24:00Z",
    actor: "Alex",
    action: "receipt registered",
    target: "inv_1003",
    summary: "Full receipt registered; invoice marked Paid.",
    severity: "Info"
  },
  {
    id: "log_8003",
    at: "2026-03-15T10:10:00Z",
    actor: "System",
    action: "blocked payable",
    target: "sb_4003",
    summary: "Supplier bill blocked due to mismatch vs approved request.",
    severity: "Exception"
  },
  {
    id: "log_8004",
    at: "2026-03-14T08:30:00Z",
    actor: "System",
    action: "transmission pending",
    target: "inv_1004",
    summary: "Invoice transmission status Pending; monitor external acceptance.",
    severity: "Warning"
  }
];

