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
  const { supplierBills } = useFinancePrototypeState();
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
          <Link className="btn" to="/finance/spend/bills">
            Back to list
          </Link>
          <button className="btn" disabled>
            Add attachment (prototype)
          </button>
          <button
            className="btn primary"
            disabled={bill.status !== "Ready" || bill.match !== "Matched"}
            onClick={() => navigate(`/finance/spend/payments?q=${encodeURIComponent(bill.id)}`)}
          >
            Send to payments queue
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
            <div className="card" style={{ padding: 12, background: "var(--c-warning-50)" }}>
              <div style={{ fontWeight: 650, color: "#92400e" }}>Blocked for payment</div>
              <div className="muted" style={{ marginTop: 4 }}>
                {bill.blockedReason ??
                  "Resolve mismatch and required controls before moving this payable to the payments queue."}
              </div>
            </div>
          ) : null}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Received
              </div>
              <div>{bill.receivedAt}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Due
              </div>
              <div>{bill.dueDate}</div>
            </div>
          </div>
        </Card>

        <Card title="Amount / Linkage">
          <div>
            <div className="muted" style={{ fontSize: 12 }}>
              Amount
            </div>
            <div style={{ fontWeight: 650, fontSize: 16 }}>{formatCurrency(bill.amount, bill.currency)}</div>
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
              <th>At</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Summary</th>
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

