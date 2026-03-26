import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { SidePanel } from "../../ui/SidePanel";
import { ActionButton } from "../../ui/ActionButton";
import type { PurchaseRequest, PurchaseRequestStatus } from "../../domain/types";
import { formatCurrency } from "../../domain/format";
import { getEnumParam, getStringParam } from "../../router/query";
import { usePermissions } from "../../state/permissions";
import { useFinancePrototypeState } from "../../state/FinancePrototypeState";

function toneForStatus(s: PurchaseRequestStatus) {
  if (s === "Approved (Committed)") return "success";
  if (s === "Rejected") return "danger";
  if (s === "Submitted") return "warning";
  if (s === "Returned for Changes") return "warning";
  return "neutral";
}

export function PurchaseRequestsPage() {
  const perms = usePermissions();
  const navigate = useNavigate();
  const loc = useLocation();
  const { purchaseRequests: allRequests, createPurchaseRequest, updatePurchaseRequestStatus } = useFinancePrototypeState();
  const params = React.useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const initialStatus = getEnumParam<PurchaseRequestStatus>(
    params,
    "status",
    ["Draft", "Submitted", "Returned for Changes", "Approved (Committed)", "Rejected"] as const
  );
  const initialQ = getStringParam(params, "q");

  const [status, setStatus] = React.useState<PurchaseRequestStatus | "All">(initialStatus ?? "All");
  const [q, setQ] = React.useState(initialQ ?? "");
  const [selected, setSelected] = React.useState<PurchaseRequest | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [draftForm, setDraftForm] = React.useState({
    title: "",
    requester: "Nikos",
    department: "Operations",
    supplier: "Studio Kappa",
    amount: "2500",
    urgency: "Normal" as PurchaseRequest["urgency"],
    attachments: "1"
  });

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (status === "All") url.searchParams.delete("status");
    else url.searchParams.set("status", status);
    if (!q.trim()) url.searchParams.delete("q");
    else url.searchParams.set("q", q.trim());
    navigate(`${loc.pathname}?${url.searchParams.toString()}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q]);

  const filtered = allRequests.filter((r) => {
    if (status !== "All" && r.status !== status) return false;
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return (
      r.title.toLowerCase().includes(needle) ||
      r.requester.toLowerCase().includes(needle) ||
      (r.supplier ?? "").toLowerCase().includes(needle) ||
      r.id.toLowerCase().includes(needle)
    );
  });

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Αιτήματα Αγοράς</h1>
          <p>Αίτημα → έγκριση → δεσμευμένη δαπάνη. Λειτουργικά σήματα ετοιμότητας μέσω επισυνάψεων & προτεραιότητας.</p>
        </div>
        <div className="row">
          <ActionButton onClick={() => setCreateOpen(true)}>Δημιουργία αιτήματος</ActionButton>
          <ActionButton
            variant="primary"
            disabled={!perms.canApproveRequest}
            disabledReason={!perms.canApproveRequest ? "You don't have permission to approve requests." : undefined}
          >
            Ουρά έγκρισης
          </ActionButton>
        </div>
      </div>

      <Card title="Φίλτρα">
        <div className="filters">
          <div className="field" style={{ minWidth: 240 }}>
            <label>Αναζήτηση</label>
            <input
              className="input"
              placeholder="Τίτλος, αιτών, προμηθευτής…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="field" style={{ minWidth: 200 }}>
            <label>Κατάσταση</label>
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value as PurchaseRequestStatus | "All")}
            >
              <option value="All">Όλα</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Returned for Changes">Returned for changes</option>
              <option value="Approved (Committed)">Approved / committed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <Chip tone="warning">{filtered.filter((r) => r.urgency === "Urgent").length} urgent</Chip>
          <Chip tone="neutral">{filtered.length} requests</Chip>
        </div>
      </Card>

      <div style={{ height: 14 }} />

      <Card title="Λίστα αιτημάτων">
        <div style={{ overflow: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Αίτημα</th>
                <th>Αιτών</th>
                <th>Τμήμα</th>
                <th>Προμηθευτής</th>
                <th>Κατηγορία</th>
                <th className="num">Ποσό</th>
                <th>Υποβλήθηκε</th>
                <th>Εγκρίνων</th>
                <th>Προτεραιότητα</th>
                <th>Επισυνάψεις</th>
                <th>Κατάσταση</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} onClick={() => setSelected(r)} style={{ cursor: "pointer" }}>
                  <td>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.id}</div>
                    <div>{r.title}</div>
                  </td>
                  <td className="muted">{r.requester}</td>
                  <td className="muted">{r.department}</td>
                  <td className="muted">{r.supplier ?? "—"}</td>
                  <td className="muted">—</td>
                  <td className="num">{formatCurrency(r.amount, r.currency)}</td>
                  <td className="muted">{r.createdAt}</td>
                  <td className="muted">—</td>
                  <td>
                    <Chip tone={r.urgency === "Urgent" ? "warning" : "neutral"}>{r.urgency}</Chip>
                  </td>
                  <td className="muted">{r.attachments}</td>
                  <td>
                    <Chip tone={toneForStatus(r.status)}>{r.status}</Chip>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="muted" style={{ padding: 16 }}>
                    No requests found. Try clearing filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <SidePanel
        open={!!selected}
        title={selected ? `${selected.id} • ${selected.title}` : "Request"}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <Chip tone={toneForStatus(selected.status)}>{selected.status}</Chip>
              <Chip tone={selected.urgency === "Urgent" ? "warning" : "neutral"}>{selected.urgency}</Chip>
            </div>
            <div className="divider" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Requester
                </div>
                <div>{selected.requester}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Department
                </div>
                <div>{selected.department}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Supplier
                </div>
                <div>{selected.supplier ?? "—"}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Submitted
                </div>
                <div>{selected.createdAt}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Attachments
                </div>
                <div>{selected.attachments}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Approver
                </div>
                <div>—</div>
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Amount
              </div>
              <div style={{ fontWeight: 650, fontSize: 16 }}>
                {formatCurrency(selected.amount, selected.currency)}
              </div>
            </div>
            {selected.attachments === 0 ? (
              <div className="card" style={{ padding: 12, background: "var(--c-warning-50)" }}>
                <div style={{ fontWeight: 650, color: "#92400e" }}>Missing attachments</div>
                <div className="muted" style={{ marginTop: 4 }}>
                  Request is likely blocked until supporting documents are added.
                </div>
              </div>
            ) : null}
            <div className="row">
              <button className="btn" onClick={() => navigate(`/purchase-requests/${selected.id}`)}>
                Open full detail
              </button>
              <button
                className="btn"
                disabled={!perms.canApproveRequest || selected.status === "Rejected" || selected.status === "Cancelled"}
                onClick={() => updatePurchaseRequestStatus(selected.id, "Returned for Changes")}
                title={!perms.canApproveRequest ? "You don't have permission to approve requests." : undefined}
              >
                Επιστροφή για Διορθώσεις
              </button>
              <button
                className="btn primary"
                disabled={!perms.canApproveRequest || selected.status === "Rejected" || selected.status === "Cancelled"}
                title={!perms.canApproveRequest ? "You don't have permission to approve requests." : undefined}
                onClick={() => updatePurchaseRequestStatus(selected.id, "Approved (Committed)")}
              >
                Έγκριση
              </button>
              <button
                className="btn"
                disabled={!perms.canApproveRequest || selected.status === "Rejected" || selected.status === "Cancelled"}
                title={!perms.canApproveRequest ? "You don't have permission to approve requests." : undefined}
                onClick={() => updatePurchaseRequestStatus(selected.id, "Rejected")}
              >
                Απόρριψη
              </button>
            </div>
          </div>
        ) : null}
      </SidePanel>

      <SidePanel open={createOpen} title="Create purchase request (demo)" onClose={() => setCreateOpen(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card" style={{ padding: 12, background: "var(--c-surface-2)" }}>
            <div style={{ fontWeight: 650 }}>Demo mode</div>
            <div className="muted" style={{ marginTop: 4 }}>
              Create request updates local UI state only (no backend persistence).
            </div>
          </div>

          <div className="field" style={{ minWidth: 320 }}>
            <label>Request title</label>
            <input
              className="input"
              value={draftForm.title}
              onChange={(e) => setDraftForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Design subcontractor (April)"
            />
          </div>

          <div className="grid-2">
            <div className="field" style={{ minWidth: 220 }}>
              <label>Requester</label>
              <input
                className="input"
                value={draftForm.requester}
                onChange={(e) => setDraftForm((p) => ({ ...p, requester: e.target.value }))}
              />
            </div>
            <div className="field" style={{ minWidth: 220 }}>
              <label>Department</label>
              <input
                className="input"
                value={draftForm.department}
                onChange={(e) => setDraftForm((p) => ({ ...p, department: e.target.value }))}
              />
            </div>
          </div>

          <div className="field" style={{ minWidth: 320 }}>
            <label>Supplier (optional)</label>
            <input
              className="input"
              value={draftForm.supplier}
              onChange={(e) => setDraftForm((p) => ({ ...p, supplier: e.target.value }))}
              placeholder="e.g. Studio Kappa"
            />
          </div>

          <div className="grid-2">
            <div className="field" style={{ minWidth: 220 }}>
              <label>Amount</label>
              <input
                className="input"
                type="number"
                value={draftForm.amount}
                onChange={(e) => setDraftForm((p) => ({ ...p, amount: e.target.value }))}
              />
            </div>
            <div className="field" style={{ minWidth: 220 }}>
              <label>Urgency</label>
              <select
                className="select"
                value={draftForm.urgency}
                onChange={(e) => setDraftForm((p) => ({ ...p, urgency: e.target.value as PurchaseRequest["urgency"] }))}
              >
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="field" style={{ minWidth: 320 }}>
            <label>Attachments (count)</label>
            <input
              className="input"
              type="number"
              value={draftForm.attachments}
              onChange={(e) => setDraftForm((p) => ({ ...p, attachments: e.target.value }))}
            />
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              Attachments drive readiness signals (missing attachments show as a warning in the detail view).
            </div>
          </div>

          <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
            <button className="btn" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button
              className="btn primary"
              disabled={!draftForm.title.trim() || !draftForm.amount.trim()}
              onClick={() => {
                const amount = Number(draftForm.amount);
                const attachments = Number(draftForm.attachments);
                const id = createPurchaseRequest({
                  title: draftForm.title.trim(),
                  requester: draftForm.requester.trim() || "—",
                  department: draftForm.department.trim() || "—",
                  supplier: draftForm.supplier.trim() ? draftForm.supplier.trim() : undefined,
                  amount: Number.isFinite(amount) ? amount : 0,
                  urgency: draftForm.urgency,
                  attachments: Number.isFinite(attachments) ? attachments : 0,
                  currency: "EUR"
                });
                setSelected({
                  id,
                  title: draftForm.title.trim(),
                  requester: draftForm.requester.trim() || "—",
                  department: draftForm.department.trim() || "—",
                  supplier: draftForm.supplier.trim() ? draftForm.supplier.trim() : undefined,
                  createdAt: new Date().toISOString().slice(0, 10),
                  amount: Number.isFinite(amount) ? amount : 0,
                  currency: "EUR",
                  urgency: draftForm.urgency,
                  status: "Draft",
                  attachments: Number.isFinite(attachments) ? attachments : 0
                });
                setCreateOpen(false);
              }}
            >
              Create (demo)
            </button>
          </div>
        </div>
      </SidePanel>
    </>
  );
}

