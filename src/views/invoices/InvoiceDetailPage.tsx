import React from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { ActionButton } from "../../ui/ActionButton";
import type { InvoiceStatus, TransmissionStatus } from "../../domain/types";
import { formatCurrency } from "../../domain/format";
import { useFinancePrototypeState } from "../../state/FinancePrototypeState";

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
  const { getLastCollectionNote, addCollectionNote, invoices, receivables, billableWork, auditEvents } =
    useFinancePrototypeState();
  const inv = invoices.find((i) => i.id === invoiceId) ?? null;

  if (!inv) {
    return (
      <div className="page-head">
        <div className="page-title">
          <h1>Invoice not found</h1>
          <p>
            Go back to <Link to="/finance/revenue/invoices">Invoices</Link>.
          </p>
        </div>
      </div>
    );
  }

  const receivable = receivables.find((r) => r.invoiceId === inv.id) ?? null;
  const outstanding = Math.max(0, inv.total - inv.paid);
  const timeline = auditEvents.filter((e) => e.target === inv.id).slice(0, 8);

  const linkedWork = billableWork.filter((w) => w.invoicedByInvoiceId === inv.id);
  const lastCollectionNote = getLastCollectionNote(inv.id);
  const lastSnippet = lastCollectionNote
    ? lastCollectionNote.text.length > 80
      ? `${lastCollectionNote.text.slice(0, 80)}…`
      : lastCollectionNote.text
    : null;

  const [noteEditorOpen, setNoteEditorOpen] = React.useState(false);
  const [noteDraft, setNoteDraft] = React.useState("");

  function sourceModuleForTarget(target: string) {
    if (target.startsWith("drf_")) return "Drafts";
    if (target.startsWith("inv_")) return "Invoices / Receivables";
    if (target.startsWith("pr_")) return "Purchase Requests";
    if (target.startsWith("sb_")) return "Supplier Bills";
    if (target.startsWith("pay_")) return "Payments Queue";
    if (target.startsWith("bud_")) return "Budget";
    if (target.startsWith("emp_")) return "Employee Costs";
    return "—";
  }

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
          <Link className="btn" to="/finance/revenue/invoices">
            Back to list
          </Link>
          <Link className="btn" to={`/finance/revenue/collections?q=${encodeURIComponent(inv.number)}`}>
            Go to Collections
          </Link>
          <ActionButton
            variant="primary"
            onClick={() => {
              setNoteDraft("");
              setNoteEditorOpen(true);
            }}
          >
            Καταχώρηση Σημείωσης
          </ActionButton>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <Card
          title="Διαβίβαση μέσω Παρόχου"
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
        </Card>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card title="Συνδεδεμένη χρεώσιμη εργασία (μόνο ανάγνωση)">
          <div style={{ overflow: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Στοιχείο</th>
                  <th>Ημ/νία</th>
                  <th>Περιγραφή</th>
                  <th>Πελάτης</th>
                  <th>Έργο</th>
                  <th className="num">Ποσό</th>
                </tr>
              </thead>
              <tbody>
                {linkedWork.length ? (
                  linkedWork.map((w) => (
                    <tr key={w.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{w.id}</td>
                      <td className="muted">{w.date}</td>
                      <td>{w.description}</td>
                      <td>{w.client}</td>
                      <td className="muted">{w.project ?? "—"}</td>
                      <td className="num">{formatCurrency(w.amount, w.currency)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="muted" style={{ padding: 16 }}>
                      No linked billable work in mock data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Collections notes / history">
          <div className="grid-2" style={{ marginBottom: 8 }}>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Latest note snippet
              </div>
              <div style={{ marginTop: 6 }}>{lastSnippet ?? receivable?.nextAction ?? "—"}</div>
              <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                Last note date:{" "}
                {lastCollectionNote ? new Date(lastCollectionNote.at).toISOString().slice(0, 10) : "—"}
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Follow-up owner
              </div>
              <div style={{ marginTop: 6 }}>{receivable?.owner ?? inv.owner}</div>
              <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                Expected payment date: —
              </div>
            </div>
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <ActionButton
              variant="primary"
              onClick={() => {
                setNoteDraft("");
                setNoteEditorOpen(true);
              }}
            >
              Καταχώρηση Σημείωσης
            </ActionButton>
            <Link className="btn" to={`/finance/revenue/collections?q=${encodeURIComponent(inv.number)}`}>
              Go to Collections
            </Link>
          </div>

          {noteEditorOpen ? (
            <div className="card" style={{ padding: 12, marginTop: 12, background: "var(--c-surface-2)" }}>
              <div className="muted" style={{ fontSize: 12 }}>
                Σημείωση είσπραξης
              </div>
              <textarea
                className="input"
                style={{ height: 90, paddingTop: 8, marginTop: 8 }}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="π.χ. κλήση προγραμματισμένη, επιβεβαίωση πληρωμής, αναμενόμενη ημερομηνία…"
              />
              <div className="row" style={{ justifyContent: "space-between", marginTop: 10 }}>
                <button
                  className="btn"
                  onClick={() => {
                    setNoteEditorOpen(false);
                    setNoteDraft("");
                  }}
                >
                  Ακύρωση
                </button>
                <button
                  className="btn primary"
                  disabled={!noteDraft.trim()}
                  onClick={() => {
                    addCollectionNote(inv.id, noteDraft, receivable?.owner ?? inv.owner);
                    setNoteEditorOpen(false);
                    setNoteDraft("");
                  }}
                >
                  Αποθήκευση σημείωσης
                </button>
              </div>
            </div>
          ) : null}
        </Card>

        <Card title="Payments">
          <div className="muted">
            No payment registrations are present in mock data for this invoice (prototype placeholder).
          </div>
        </Card>
      </div>

      <Card title="Timeline / Activity">
        <table className="table">
          <thead>
            <tr>
              <th>Χρόνος</th>
              <th>Χρήστης</th>
              <th>Ενέργεια</th>
              <th>Ενότητα</th>
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
                  <td className="muted">{sourceModuleForTarget(e.target)}</td>
                  <td>{e.summary}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="muted" style={{ padding: 16 }}>
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

