import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import type { SupplierBill, SupplierBillStatus } from "../../domain/types";
import { purchaseRequests, auditEvents } from "../../mock/data";
import { formatCurrency } from "../../domain/format";
import { useFinancePrototypeState } from "../../state/FinancePrototypeState";

function toneForBillStatus(s: SupplierBillStatus) {
  if (s === "Paid") return "success";
  if (s === "Overdue") return "danger";
  if (s === "Blocked") return "warning";
  return "neutral";
}

function toneForMatch(m: SupplierBill["match"]) {
  if (m === "Matched") return "success";
  if (m === "Mismatch") return "warning";
  return "neutral";
}

export function SupplierBillDetailPage() {
  const { billId } = useParams();
  const { supplierBills, updateSupplierBill, sendBillToPaymentsQueue } = useFinancePrototypeState();
  const navigate = useNavigate();
  const bill = supplierBills.find((b) => b.id === billId) ?? null;

  if (!bill) {
    return (
      <div className="page-head">
        <div className="page-title">
          <h1>Supplier bill not found</h1>
          <p>
            Go back to <Link to="/finance/spend/bills">Supplier Bills</Link>.
          </p>
        </div>
      </div>
    );
  }

  const req = bill.linkedRequestId
    ? purchaseRequests.find((r) => r.id === bill.linkedRequestId) ?? null
    : null;
  const timeline = auditEvents.filter((e) => e.target === bill.id).slice(0, 8);

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1 style={{ fontFamily: "var(--font-mono)" }}>{bill.id}</h1>
          <p>{bill.supplier}</p>
        </div>
        <div className="row">
          <Link className="btn ghost btn--sm" to="/finance/spend/bills" title="Επιστροφή στη λίστα">
            Πίσω
          </Link>
          <button
            className="btn"
            onClick={() => {
              // Prototype: attachment handling is simplified into clearing the most common block.
              updateSupplierBill(bill.id, { blockedReason: undefined });
            }}
          >
            Προσθήκη Επισύναψης
          </button>
          <button
            className="btn primary"
            disabled={bill.status !== "Ready" || bill.match !== "Matched"}
            onClick={() => {
              sendBillToPaymentsQueue(bill.id);
              navigate(`/finance/spend/payments?q=${encodeURIComponent(bill.id)}`);
            }}
          >
            Αποστολή στην ουρά
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <Card
          title="Discrepancy / match"
          right={
            <div className="row">
              <Chip tone={toneForBillStatus(bill.status)}>{bill.status}</Chip>
              <Chip tone={toneForMatch(bill.match)}>{bill.match}</Chip>
            </div>
          }
        >
          {bill.status !== "Paid" && (bill.status === "Blocked" || bill.match !== "Matched") ? (
            <div className="finance-callout" data-tone="warning">
              <div className="finance-callout__title">Blocked for payment</div>
              <div className="finance-callout__body">
                {bill.blockedReason ??
                  "Resolve mismatch and required controls before moving this payable to the payments queue."}
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                {bill.match !== "Matched" ? (
                  <button
                    className="btn"
                    onClick={() => {
                      updateSupplierBill(bill.id, { match: "Matched", blockedReason: undefined });
                    }}
                  >
                    Επίλυση Ασυμφωνίας
                  </button>
                ) : null}
                {bill.status !== "Ready" ? (
                  <button
                    className="btn primary"
                    disabled={bill.match !== "Matched"}
                    title={bill.match !== "Matched" ? "Πρώτα επιλύστε την ασυμφωνία." : undefined}
                    onClick={() => {
                      updateSupplierBill(bill.id, { status: "Ready", blockedReason: undefined });
                    }}
                  >
                    Σήμανση ως Έτοιμο για Πληρωμή
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="finance-kv-grid" style={{ marginTop: 12 }}>
            <div>
              <div className="finance-kv__label">
                Received
              </div>
              <div>{bill.receivedAt}</div>
            </div>
            <div>
              <div className="finance-kv__label">
                Due
              </div>
              <div>{bill.dueDate}</div>
            </div>
          </div>
        </Card>

        <Card title="Amount / Linkage">
          <div>
            <div className="finance-kv__label">
              Amount
            </div>
            <div className="finance-kv__value finance-kv__value--strong" style={{ fontSize: 16 }}>
              {formatCurrency(bill.amount, bill.currency)}
            </div>
          </div>

          <div className="divider" style={{ margin: "12px 0" }} />

          <div className="muted" style={{ fontSize: 12 }}>
            Linked purchase request
          </div>
          {req ? (
            <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{req.id}</div>
              <Link className="btn" to={`/finance/spend/requests/${req.id}`}>
                Open request
              </Link>
            </div>
          ) : (
            <div className="muted" style={{ marginTop: 6 }}>
              None linked.
            </div>
          )}
        </Card>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
        <Card title="Payment readiness / history (prototype)">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Payment readiness
              </div>
              <div style={{ marginTop: 6 }}>
                <Chip tone={toneForBillStatus(bill.status)}>{bill.status}</Chip>
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Reason (if blocked)
              </div>
              <div style={{ marginTop: 6 }}>{bill.blockedReason ?? "—"}</div>
            </div>
          </div>
          <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
            Payment history entries are not present in the mock data for this prototype.
          </div>
        </Card>

        <Card title="Attachments (prototype)">
          <div className="muted">No attachment records are present in mock data.</div>
        </Card>
      </div>

      <Card title="Timeline / Activity">
        <table className="table">
          <thead>
            <tr>
              <th>Χρόνος</th>
              <th>Χρήστης</th>
              <th>Ενέργεια</th>
              <th>Σύνοψη</th>
            </tr>
          </thead>
          <tbody>
            {timeline.length ? (
              timeline.map((e) => (
                <tr key={e.id}>
                  <td className="muted">{new Date(e.at).toISOString().replace("T", " ").slice(0, 16)}</td>
                  <td>{e.actor}</td>
                  <td className="muted">{e.action}</td>
                  <td>{e.summary}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="muted" style={{ padding: 16 }}>
                  No timeline events for this supplier bill in mock data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}

