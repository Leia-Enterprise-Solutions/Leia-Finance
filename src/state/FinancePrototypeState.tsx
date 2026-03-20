import React from "react";
import type { PaymentQueueItem, SupplierBill } from "../domain/types";
import { paymentsQueue as initialPaymentsQueue, supplierBills as initialSupplierBills } from "../mock/data";

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

  paymentsQueue: PaymentQueueItem[];
  supplierBills: SupplierBill[];
  executePaymentsBatch: (paymentIds: string[]) => void;
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
      },
      getLastCollectionNote: (invoiceId) => {
        const notes = collectionNotesByInvoiceId[invoiceId];
        return notes && notes.length ? notes[0] : null;
      },
      paymentsQueue,
      supplierBills,
      executePaymentsBatch: (paymentIds) => {
        if (paymentIds.length === 0) return;

        // v1: UI-only "cash-out" simulation:
        // - Payments in the selected batch move to Executed
        // - Their linked supplier bills move to Paid
        setPaymentsQueue((prev) =>
          prev.map((p) =>
            paymentIds.includes(p.id)
              ? {
                  ...p,
                  readiness: "Ready",
                  status: "Executed"
                }
              : p
          )
        );

        const paymentToBillId = new Map(
          initialPaymentsQueue
            .filter((p) => paymentIds.includes(p.id))
            .map((p) => [p.id, p.supplierBillId])
        );
        const billIdsToMarkPaid = Array.from(paymentToBillId.values());
        setSupplierBills((prev) =>
          prev.map((b) => (billIdsToMarkPaid.includes(b.id) ? { ...b, status: "Paid" } : b))
        );
      }
    };
  }, [collectionNotesByInvoiceId, paymentsQueue, supplierBills]);

  return <FinancePrototypeStateContext.Provider value={api}>{children}</FinancePrototypeStateContext.Provider>;
}

export function useFinancePrototypeState() {
  const ctx = React.useContext(FinancePrototypeStateContext);
  if (!ctx) throw new Error("useFinancePrototypeState must be used within FinancePrototypeStateProvider");
  return ctx;
}

