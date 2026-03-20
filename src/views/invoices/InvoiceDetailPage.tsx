import React from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import type { InvoiceStatus, TransmissionStatus } from "../../domain/types";
import { invoices, receivables, auditEvents } from "../../mock/data";
import { formatCurrency } from "../../domain/format";

function toneForInvoiceStatus(s: InvoiceStatus) {
  if (s === "Paid") return "success";
  if (s === "Overdue") return "danger";
  if (s === "Partially Paid") return "warning";
  return "neutral";
}

function toneForTransmission(s: TransmissionStatus) {
  if (s === "Rejected") return "danger";
  if (s === "Pending") return "warning";
  return "neutral";
}

export function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const inv = invoices.find((i) => i.id === invoiceId) ?? null;

  if (!inv) {
    return (
      <div className="page-head">
        <div className="page-title">
          <h1>Invoice not found</h1>
          <p>
            Go back to <Link to="/invoices">Invoices</Link>.
          </p>
        </div>
      </div>
    );
  }

  const receivable = receivables.find((r) => r.invoiceId === inv.id) ?? null;
  const outstanding = Math.max(0, inv.total - inv.paid);
  const timeline = auditEvents.filter((e) => e.target === inv.id).slice(0, 8);

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1 style={{ fontFamily: "var(--font-mono)" }}>{inv.number}</h1>
          <p>
            {inv.client}
            {inv.project ? ` • ${inv.project}` : ""}
          </p>
        </div>
        <div className="row">
          <Link className="btn" to="/invoices">
            Back to list
          </Link>
          <button className="btn">Open PDF</button>
          <button className="btn primary">Register receipt</button>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <Card
          title="Status"
          right={
            <div className="row">
              <Chip tone={toneForInvoiceStatus(inv.status)}>{inv.status}</Chip>
              <Chip tone={toneForTransmission(inv.transmission)}>{inv.transmission}</Chip>
            </div>
          }
        >
          {inv.transmission === "Rejected" ? (
            <div className="card" style={{ padding: 12, background: "var(--c-danger-50)" }}>
              <div style={{ fontWeight: 650, color: "#991b1b" }}>Transmission rejected</div>
              <div className="muted" style={{ marginTop: 4 }}>
                Correction required before resending to external fiscal channel.
              </div>
            </div>
          ) : inv.transmission === "Pending" ? (
            <div className="card" style={{ padding: 12, background: "var(--c-warning-50)" }}>
              <div style={{ fontWeight: 650, color: "#92400e" }}>Transmission pending</div>
              <div className="muted" style={{ marginTop: 4 }}>
                Monitor external acceptance; keep visibility in list filters.
              </div>
            </div>
          ) : null}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Issue date
              </div>
              <div>{inv.issueDate}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Due date
              </div>
              <div>{inv.dueDate}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Owner
              </div>
              <div>{inv.owner}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Currency
              </div>
              <div>{inv.currency}</div>
            </div>
          </div>
        </Card>

        <Card title="Amounts">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Total
              </div>
              <div style={{ fontWeight: 650, fontSize: 16 }}>{formatCurrency(inv.total, inv.currency)}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Paid
              </div>
              <div style={{ fontWeight: 650, fontSize: 16 }}>{formatCurrency(inv.paid, inv.currency)}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Outstanding
              </div>
              <div style={{ fontWeight: 650, fontSize: 16 }}>{formatCurrency(outstanding, inv.currency)}</div>
            </div>
          </div>

          {receivable ? (
            <div className="card" style={{ padding: 12, background: "var(--c-surface-2)", marginTop: 12 }}>
              <div className="muted" style={{ fontSize: 12 }}>
                Collections note
              </div>
              <div style={{ marginTop: 6 }}>{receivable.nextAction ?? "—"}</div>
            </div>
          ) : null}
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
                  No timeline events for this invoice in mock data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}

