import React from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import type { SupplierBill, SupplierBillStatus } from "../../domain/types";
import { supplierBills, purchaseRequests, auditEvents } from "../../mock/data";
import { formatCurrency } from "../../domain/format";

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
  const bill = supplierBills.find((b) => b.id === billId) ?? null;

  if (!bill) {
    return (
      <div className="page-head">
        <div className="page-title">
          <h1>Supplier bill not found</h1>
          <p>
            Go back to <Link to="/supplier-bills">Supplier Bills</Link>.
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
          <Link className="btn" to="/supplier-bills">
            Back to list
          </Link>
          <button className="btn">Add attachment</button>
          <button className="btn primary" disabled={bill.status !== "Ready"}>
            Add to payment batch
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <Card
          title="Status / Match"
          right={
            <div className="row">
              <Chip tone={toneForBillStatus(bill.status)}>{bill.status}</Chip>
              <Chip tone={toneForMatch(bill.match)}>{bill.match}</Chip>
            </div>
          }
        >
          {bill.status === "Blocked" || bill.match !== "Matched" ? (
            <div className="card" style={{ padding: 12, background: "var(--c-warning-50)" }}>
              <div style={{ fontWeight: 650, color: "#92400e" }}>Blocked / mismatch</div>
              <div className="muted" style={{ marginTop: 4 }}>
                {bill.blockedReason ?? "Resolve mismatch or required controls before marking Ready."}
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
              <Link className="btn" to={`/purchase-requests/${req.id}`}>
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

