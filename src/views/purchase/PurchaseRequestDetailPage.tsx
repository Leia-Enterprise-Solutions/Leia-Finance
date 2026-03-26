import React from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import type { PurchaseRequestStatus } from "../../domain/types";
import { formatCurrency } from "../../domain/format";
import { useFinancePrototypeState } from "../../state/FinancePrototypeState";

function toneForStatus(s: PurchaseRequestStatus) {
  if (s === "Approved (Committed)") return "success";
  if (s === "Rejected") return "danger";
  if (s === "Submitted") return "warning";
  if (s === "Returned for Changes") return "warning";
  return "neutral";
}

export function PurchaseRequestDetailPage() {
  const { requestId } = useParams();
  const { purchaseRequests, supplierBills, auditEvents, updatePurchaseRequestStatus } = useFinancePrototypeState();
  const req = purchaseRequests.find((r) => r.id === requestId) ?? null;

  if (!req) {
    return (
      <div className="page-head">
        <div className="page-title">
          <h1>Request not found</h1>
          <p>
            Go back to <Link to="/finance/spend/requests">Purchase Requests</Link>.
          </p>
        </div>
      </div>
    );
  }

  const linkedBill = supplierBills.find((b) => b.linkedRequestId === req.id) ?? null;
  const timeline = auditEvents.filter((e) => e.target === req.id).slice(0, 8);

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>{req.title}</h1>
          <p style={{ fontFamily: "var(--font-mono)" }}>{req.id}</p>
        </div>
        <div className="row">
          <Link className="btn" to="/finance/spend/requests">
            Back to list
          </Link>
          <button
            className="btn"
            disabled={req.status === "Rejected" || req.status === "Cancelled"}
            onClick={() => updatePurchaseRequestStatus(req.id, "Returned for Changes")}
          >
            Επιστροφή για Διορθώσεις
          </button>
          <button
            className="btn primary"
            disabled={req.status === "Rejected" || req.status === "Cancelled"}
            onClick={() => updatePurchaseRequestStatus(req.id, "Approved (Committed)")}
          >
            Έγκριση
          </button>
          <button
            className="btn"
            disabled={req.status === "Rejected" || req.status === "Cancelled"}
            onClick={() => updatePurchaseRequestStatus(req.id, "Rejected")}
          >
            Απόρριψη
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <Card
          title="Approval / Status"
          right={
            <div className="row">
              <Chip tone={toneForStatus(req.status)}>{req.status}</Chip>
              <Chip tone={req.urgency === "Urgent" ? "warning" : "neutral"}>{req.urgency}</Chip>
            </div>
          }
        >
          {req.attachments === 0 ? (
            <div className="finance-callout" data-tone="warning">
              <div className="finance-callout__title">Missing attachments</div>
              <div className="finance-callout__body">
                Request is likely blocked until supporting documents are added.
              </div>
            </div>
          ) : null}

          <div className="finance-kv-grid" style={{ marginTop: 12 }}>
            <div>
              <div className="finance-kv__label">
                Requester
              </div>
              <div>{req.requester}</div>
            </div>
            <div>
              <div className="finance-kv__label">
                Department
              </div>
              <div>{req.department}</div>
            </div>
            <div>
              <div className="finance-kv__label">
                Supplier
              </div>
              <div>{req.supplier ?? "—"}</div>
            </div>
            <div>
              <div className="finance-kv__label">
                Created
              </div>
              <div>{req.createdAt}</div>
            </div>
          </div>
        </Card>

        <Card title="Budget / Amount">
          <div>
            <div className="muted" style={{ fontSize: 12 }}>
              Amount
            </div>
            <div style={{ fontWeight: 650, fontSize: 16 }}>{formatCurrency(req.amount, req.currency)}</div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="muted" style={{ fontSize: 12 }}>
              Budget context (mock)
            </div>
            <div className="muted">Committed spend updates Budget Overview after approval.</div>
          </div>

          <div className="divider" style={{ margin: "12px 0" }} />

          <div className="muted" style={{ fontSize: 12 }}>
            Linked supplier bill
          </div>
          {linkedBill ? (
            <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{linkedBill.id}</div>
              <Link className="btn" to={`/supplier-bills/${linkedBill.id}`}>
                Open bill
              </Link>
            </div>
          ) : (
            <div className="muted" style={{ marginTop: 6 }}>
              None linked yet.
            </div>
          )}
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
                  No timeline events for this request in mock data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}

