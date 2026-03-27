import React from "react";
import type {
  AuditEvent,
  BillableWorkItem,
  DraftLine,
  Invoice,
  InvoiceDraft,
  PaymentQueueItem,
  PurchaseRequest,
  ReceivableWorkItem,
  SupplierBill,
  PurchaseRequestStatus,
  SupplierBillStatus
} from "../domain/types";
import {
  auditEvents as initialAuditEvents,
  billableWork as initialBillableWork,
  draftLinesByDraftId as initialDraftLinesByDraftId,
  invoiceDrafts as initialInvoiceDrafts,
  invoices as initialInvoices,
  paymentsQueue as initialPaymentsQueue,
  purchaseRequests as initialPurchaseRequests,
  receivables as initialReceivables,
  supplierBills as initialSupplierBills
} from "../mock/data";

function computeDraftNetTotal(lines: DraftLine[]) {
  return lines.reduce((a, l) => {
    const qty = Number.isFinite(l.quantity) ? (l.quantity as number) : 1;
    const unitPrice = Number.isFinite(l.unitPrice) ? (l.unitPrice as number) : Number.isFinite(l.amount) ? l.amount : 0;
    const discountPct = Number.isFinite(l.discountPct) ? (l.discountPct as number) : 0;
    const discountFactor = 1 - Math.min(100, Math.max(0, discountPct)) / 100;
    const net = qty * unitPrice * discountFactor;
    const fallback = Number.isFinite(l.amount) ? l.amount : 0;
    return a + (Number.isFinite(net) ? net : fallback);
  }, 0);
}

type CollectionNote = {
  id: string;
  at: string;
  owner: string;
  text: string;
};

type FinancePrototypeState = {
  collectionNotesByInvoiceId: Record<string, CollectionNote[]>;
  addCollectionNote: (invoiceId: string, text: string, owner: string) => void;
  getLastCollectionNote: (invoiceId: string) => CollectionNote | null;

  billableWork: BillableWorkItem[];

  invoiceDrafts: InvoiceDraft[];
  draftLinesByDraftId: Record<string, DraftLine[]>;
  upsertDraft: (draft: InvoiceDraft) => void;
  setDraftLines: (draftId: string, lines: DraftLine[]) => void;
  discardDraft: (draftId: string) => void;
  issueDraft: (draftId: string, payload: { client: string; project?: string; owner: string }) => string | null;

  invoices: Invoice[];
  receivables: ReceivableWorkItem[];

  purchaseRequests: PurchaseRequest[];
  createPurchaseRequest: (draft: Omit<PurchaseRequest, "id" | "createdAt" | "status" | "currency"> & { currency?: string }) => string;
  updatePurchaseRequestStatus: (requestId: string, status: PurchaseRequestStatus) => void;

  paymentsQueue: PaymentQueueItem[];
  supplierBills: SupplierBill[];
  updateSupplierBill: (billId: string, patch: Partial<SupplierBill> & { status?: SupplierBillStatus }) => void;
  sendBillToPaymentsQueue: (billId: string) => void;
  schedulePaymentsBatch: (paymentIds: string[]) => void;
  executePaymentsBatch: (paymentIds: string[]) => void;

  auditEvents: AuditEvent[];
};

const FinancePrototypeStateContext = React.createContext<FinancePrototypeState | null>(null);

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}`;
}

export function FinancePrototypeStateProvider({ children }: { children: React.ReactNode }) {
  const [collectionNotesByInvoiceId, setCollectionNotesByInvoiceId] = React.useState<Record<string, CollectionNote[]>>({
    inv_1001: [
      {
        id: "note_9101",
        at: "2026-03-18T08:12:00Z",
        owner: "Alex",
        text: "Called AP owner. Waiting for final payment confirmation; re-send invoice email if no update by 2026-03-19."
      },
      {
        id: "note_9102",
        at: "2026-03-12T16:05:00Z",
        owner: "Alex",
        text: "Received no response yet. Confirmed outstanding amount and due date; scheduled follow-up call."
      }
    ],
    inv_1002: [
      {
        id: "note_9201",
        at: "2026-03-16T10:20:00Z",
        owner: "Iris",
        text: "Partial payment noted. Asked for the remaining balance timeline and confirmed expected payment date."
      }
    ],
    inv_1004: [
      {
        id: "note_9301",
        at: "2026-03-15T12:40:00Z",
        owner: "Mina",
        text: "Sent reminder ahead of due date. No objections on transmission status; monitor acceptance."
      }
    ]
  });

  const [paymentsQueue, setPaymentsQueue] = React.useState<PaymentQueueItem[]>(initialPaymentsQueue);
  const [supplierBills, setSupplierBills] = React.useState<SupplierBill[]>(initialSupplierBills);
  const [purchaseRequests, setPurchaseRequests] = React.useState<PurchaseRequest[]>(initialPurchaseRequests);
  const [invoiceDrafts, setInvoiceDrafts] = React.useState<InvoiceDraft[]>(initialInvoiceDrafts);
  const [draftLinesByDraftId, setDraftLinesByDraftId] =
    React.useState<Record<string, DraftLine[]>>(initialDraftLinesByDraftId);
  const [invoices, setInvoices] = React.useState<Invoice[]>(initialInvoices);
  const [receivables, setReceivables] = React.useState<ReceivableWorkItem[]>(initialReceivables);
  const [billableWork, setBillableWork] = React.useState(initialBillableWork);
  const [auditEvents, setAuditEvents] = React.useState<AuditEvent[]>(initialAuditEvents);

  const invoiceSeqRef = React.useRef<number>(
    (() => {
      const nums = initialInvoices
        .map((i) => Number(i.id.replace("inv_", "")))
        .filter((n) => Number.isFinite(n));
      return nums.length ? Math.max(...nums) : 1000;
    })()
  );

  function pushAuditEvent(e: Omit<AuditEvent, "id" | "at"> & { at?: string }) {
    const event: AuditEvent = {
      id: makeId("log"),
      at: e.at ?? new Date().toISOString(),
      actor: e.actor,
      action: e.action,
      target: e.target,
      summary: e.summary,
      severity: e.severity
    };
    setAuditEvents((prev) => [event, ...prev]);
  }

  const api = React.useMemo<FinancePrototypeState>(() => {
    return {
      collectionNotesByInvoiceId,
      addCollectionNote: (invoiceId, text, owner) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const note: CollectionNote = {
          id: makeId("note"),
          at: new Date().toISOString(),
          owner,
          text: trimmed
        };
        setCollectionNotesByInvoiceId((prev) => {
          const existing = prev[invoiceId] ?? [];
          return { ...prev, [invoiceId]: [note, ...existing] };
        });
        pushAuditEvent({
          actor: owner,
          action: "collection note added",
          target: invoiceId,
          summary: `Collections note added (${trimmed.length} chars).`,
          severity: "Info"
        });
      },
      getLastCollectionNote: (invoiceId) => {
        const notes = collectionNotesByInvoiceId[invoiceId];
        return notes && notes.length ? notes[0] : null;
      },
      billableWork,
      invoiceDrafts,
      draftLinesByDraftId,
      upsertDraft: (draft) => {
        setInvoiceDrafts((prev) => {
          const idx = prev.findIndex((d) => d.id === draft.id);
          if (idx === -1) return [draft, ...prev];
          const next = prev.slice();
          next[idx] = draft;
          return next;
        });
      },
      setDraftLines: (draftId, lines) => {
        setDraftLinesByDraftId((prev) => ({ ...prev, [draftId]: lines }));
        setInvoiceDrafts((prev) =>
          prev.map((d) => {
            if (d.id !== draftId) return d;
            const total = computeDraftNetTotal(lines);
            const nextStatus: InvoiceDraft["status"] =
              d.status === "Issued" ? "Issued" : lines.length === 0 ? "In Progress" : "Ready to Issue";
            return {
              ...d,
              draftTotal: total,
              reservedLines: lines.length,
              updatedAt: new Date().toISOString(),
              status: nextStatus
            };
          })
        );
      },
      discardDraft: (draftId) => {
        setDraftLinesByDraftId((prev) => {
          const next = { ...prev };
          delete next[draftId];
          return next;
        });
        setInvoiceDrafts((prev) => prev.filter((d) => d.id !== draftId));
        setBillableWork((prev) =>
          prev.map((w) => (w.reservedByDraftId === draftId ? { ...w, status: "Available", reservedByDraftId: undefined } : w))
        );
        pushAuditEvent({
          actor: "System",
          action: "draft discarded",
          target: draftId,
          summary: "Draft discarded; reservations released.",
          severity: "Warning"
        });
      },
      issueDraft: (draftId, payload) => {
        const draft = invoiceDrafts.find((d) => d.id === draftId) ?? null;
        const lines = draftLinesByDraftId[draftId] ?? [];
        if (!draft || lines.length === 0) return null;

        invoiceSeqRef.current += 1;
        const invId = `inv_${invoiceSeqRef.current}`;
        const now = new Date();
        const issueDate = draft.issueDate ?? now.toISOString().slice(0, 10);
        const dueDate =
          draft.dueDate ??
          (() => {
            const d = new Date(now);
            d.setDate(d.getDate() + 30);
            return d.toISOString().slice(0, 10);
          })();
        const total = computeDraftNetTotal(lines);
        const currency = lines[0]?.currency ?? draft.currency ?? "EUR";

        const inv: Invoice = {
          id: invId,
          number: `INV-${now.getFullYear()}-${String(invoiceSeqRef.current).padStart(5, "0")}`,
          client: payload.client,
          project: payload.project,
          issueDate,
          dueDate,
          currency,
          total,
          paid: 0,
          status: "Issued",
          transmission: "Pending",
          owner: payload.owner
        };

        setInvoices((prev) => [inv, ...prev]);
        setReceivables((prev) => [
          {
            invoiceId: inv.id,
            invoiceNumber: inv.number,
            client: inv.client,
            dueDate: inv.dueDate,
            outstanding: inv.total,
            currency: inv.currency,
            signal: "Not Due",
            owner: payload.owner,
            nextAction: "Follow-up scheduled"
          },
          ...prev
        ]);

        // Mark linked billable work as invoiced & release reservations.
        const sourceIds = new Set(lines.map((l) => l.sourceId));
        setBillableWork((prev) =>
          prev.map((w) =>
            sourceIds.has(w.id)
              ? {
                  ...w,
                  status: "Invoiced",
                  reservedByDraftId: undefined,
                  invoicedByInvoiceId: inv.id
                }
              : w
          )
        );

        // Mark draft as issued (keep record for traceability).
        setInvoiceDrafts((prev) => prev.map((d) => (d.id === draftId ? { ...d, status: "Issued", updatedAt: new Date().toISOString() } : d)));

        pushAuditEvent({
          actor: payload.owner,
          action: "invoice issued (prototype)",
          target: inv.id,
          summary: `Issued from draft ${draftId} (${lines.length} lines).`,
          severity: "Info"
        });

        return inv.id;
      },
      invoices,
      receivables,
      purchaseRequests,
      createPurchaseRequest: (draft) => {
        const id = `pr_${Date.now()}`;
        const createdAt = new Date().toISOString().slice(0, 10);
        const req: PurchaseRequest = {
          id,
          title: draft.title,
          requester: draft.requester,
          department: draft.department,
          supplier: draft.supplier,
          createdAt,
          amount: draft.amount,
          currency: draft.currency ?? "EUR",
          urgency: draft.urgency,
          status: "Draft",
          attachments: draft.attachments
        };
        setPurchaseRequests((prev) => [req, ...prev]);
        pushAuditEvent({
          actor: draft.requester,
          action: "purchase request created",
          target: id,
          summary: `Purchase request created (${req.amount} ${req.currency}).`,
          severity: "Info"
        });
        return id;
      },
      updatePurchaseRequestStatus: (requestId, status) => {
        setPurchaseRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status } : r)));
        pushAuditEvent({
          actor: "System",
          action: "purchase request status updated",
          target: requestId,
          summary: `Status changed to ${status}.`,
          severity: status === "Rejected" ? "Warning" : "Info"
        });
      },
      paymentsQueue,
      supplierBills,
      updateSupplierBill: (billId, patch) => {
        setSupplierBills((prev) => prev.map((b) => (b.id === billId ? { ...b, ...patch } : b)));
        pushAuditEvent({
          actor: "System",
          action: "supplier bill updated",
          target: billId,
          summary: "Supplier bill updated (prototype).",
          severity: "Info"
        });
      },
      sendBillToPaymentsQueue: (billId) => {
        const bill = supplierBills.find((b) => b.id === billId) ?? null;
        if (!bill) return;
        const exists = paymentsQueue.some((p) => p.supplierBillId === billId);
        if (exists) return;
        const item: PaymentQueueItem = {
          id: makeId("pay"),
          supplierBillId: bill.id,
          supplier: bill.supplier,
          dueDate: bill.dueDate,
          amount: bill.amount,
          currency: bill.currency,
          readiness: bill.status === "Ready" && bill.match === "Matched" ? "Ready" : "Blocked",
          status: "Prepared",
          blockedReason:
            bill.status === "Ready" && bill.match === "Matched"
              ? undefined
              : bill.blockedReason ?? (bill.match === "Mismatch" ? "Mismatch vs approved request" : "Missing controls")
        };
        setPaymentsQueue((prev) => [item, ...prev]);
        pushAuditEvent({
          actor: "System",
          action: "sent to payments queue",
          target: item.id,
          summary: `Bill ${billId} added to payments queue.`,
          severity: "Info"
        });
      },
      schedulePaymentsBatch: (paymentIds) => {
        if (paymentIds.length === 0) return;
        setPaymentsQueue((prev) =>
          prev.map((p) =>
            paymentIds.includes(p.id) && p.status === "Prepared" ? { ...p, status: "Scheduled" } : p
          )
        );
        pushAuditEvent({
          actor: "System",
          action: "payments scheduled",
          target: `batch_${makeId("sch")}`,
          summary: `Scheduled ${paymentIds.length} payment(s).`,
          severity: "Info"
        });
      },
      executePaymentsBatch: (paymentIds) => {
        if (paymentIds.length === 0) return;

        // v1: UI-only "cash-out" simulation:
        // - Scheduled payments in the selected batch move to Executed
        // - Their linked supplier bills move to Paid
        const billIdsToMarkPaid: string[] = [];
        setPaymentsQueue((prev) =>
          prev.map((p) => {
            if (!paymentIds.includes(p.id)) return p;
            if (p.status !== "Scheduled") return p;
            billIdsToMarkPaid.push(p.supplierBillId);
            return {
              ...p,
              readiness: "Ready",
              status: "Executed"
            };
          })
        );

        setSupplierBills((prev) =>
          prev.map((b) => (billIdsToMarkPaid.includes(b.id) ? { ...b, status: "Paid" } : b))
        );
        pushAuditEvent({
          actor: "System",
          action: "payment executed",
          target: `batch_${makeId("payexec")}`,
          summary: `Executed ${paymentIds.length} payment(s).`,
          severity: "Info"
        });
      },
      auditEvents
    };
  }, [
    auditEvents,
    billableWork,
    collectionNotesByInvoiceId,
    draftLinesByDraftId,
    invoiceDrafts,
    invoices,
    paymentsQueue,
    purchaseRequests,
    receivables,
    supplierBills
  ]);

  return <FinancePrototypeStateContext.Provider value={api}>{children}</FinancePrototypeStateContext.Provider>;
}

export function useFinancePrototypeState() {
  const ctx = React.useContext(FinancePrototypeStateContext);
  if (!ctx) throw new Error("useFinancePrototypeState must be used within FinancePrototypeStateProvider");
  return ctx;
}

