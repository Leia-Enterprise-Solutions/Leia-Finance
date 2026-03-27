import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { SidePanel } from "../../ui/SidePanel";
import { ActionButton } from "../../ui/ActionButton";
import { Popover } from "../../ui/Popover";
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
  const initialFrom = getStringParam(params, "from");
  const initialTo = getStringParam(params, "to");

  const [status, setStatus] = React.useState<PurchaseRequestStatus | "All">(initialStatus ?? "All");
  const [q, setQ] = React.useState(initialQ ?? "");
  const [from, setFrom] = React.useState(initialFrom ?? "");
  const [to, setTo] = React.useState(initialTo ?? "");
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
    if (!from.trim()) url.searchParams.delete("from");
    else url.searchParams.set("from", from.trim());
    if (!to.trim()) url.searchParams.delete("to");
    else url.searchParams.set("to", to.trim());
    navigate(`${loc.pathname}?${url.searchParams.toString()}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q, from, to]);

  const filtered = allRequests.filter((r) => {
    if (status !== "All" && r.status !== status) return false;
    if (from.trim() && r.createdAt < from.trim()) return false;
    if (to.trim() && r.createdAt > to.trim()) return false;
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

      <div className="invoice-filters-bar">
        <div className="invoice-filters-row">
          <div className="invoice-filters-main">
            <div className="field invoice-filter-field invoice-filter-field--wide">
            <label>Αναζήτηση</label>
            <input
              className="input"
              placeholder="Τίτλος, αιτών, προμηθευτής…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            </div>
            <div className="field invoice-filter-field">
              <label>Κατάσταση</label>
              <select
                className="select"
                value={status}
                onChange={(e) => setStatus(e.target.value as PurchaseRequestStatus | "All")}
              >
                <option value="All">Όλα</option>
                <option value="Draft">Πρόχειρο</option>
                <option value="Submitted">Υποβλήθηκε</option>
                <option value="Returned for Changes">Επιστροφή για διορθώσεις</option>
                <option value="Approved (Committed)">Εγκεκριμένο (δέσμευση)</option>
                <option value="Rejected">Απορρίφθηκε</option>
              </select>
            </div>
            <Popover
              placement="bottom-end"
              trigger={({ ref, onClick, "aria-expanded": ariaExpanded }) => (
                <button ref={ref} className="btn btn--sm" onClick={onClick} aria-expanded={ariaExpanded}>
                  <i className="bi bi-funnel" aria-hidden="true" />
                  <span>Φίλτρα</span>
                </button>
              )}
            >
              <div className="filters-more">
                <div className="filters-more__item">
                  <div className="field invoice-filter-field">
                    <label>Υποβολή από</label>
                    <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                  </div>
                </div>
                <div className="filters-more__item">
                  <div className="field invoice-filter-field">
                    <label>Υποβολή έως</label>
                    <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                  </div>
                </div>
              </div>
            </Popover>
            <button
              className="btn ghost btn--sm"
              onClick={() => {
                setStatus("All");
                setQ("");
                setFrom("");
                setTo("");
              }}
              title="Εκκαθάριση φίλτρων"
            >
              <span>Εκκαθάριση</span>
            </button>
          </div>
          <div className="invoice-filters-right">
            <div className="row" style={{ gap: 8 }}>
              <Chip tone="warning">{filtered.filter((r) => r.urgency === "Urgent").length} urgent</Chip>
              <Chip tone="neutral">{filtered.length} requests</Chip>
            </div>
          </div>
        </div>
      </div>

      <div className="finance-spacer" />

      <Card title="Λίστα αιτημάτων">
        <div className="finance-table-wrap">
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
                <tr key={r.id} onClick={() => setSelected(r)} className="finance-table-clickrow">
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
            <div className="finance-kv-grid">
              <div>
                <div className="finance-kv__label">
                  Requester
                </div>
                <div>{selected.requester}</div>
              </div>
              <div>
                <div className="finance-kv__label">
                  Department
                </div>
                <div>{selected.department}</div>
              </div>
              <div>
                <div className="finance-kv__label">
                  Supplier
                </div>
                <div>{selected.supplier ?? "—"}</div>
              </div>
              <div>
                <div className="finance-kv__label">
                  Submitted
                </div>
                <div>{selected.createdAt}</div>
              </div>
              <div>
                <div className="finance-kv__label">
                  Attachments
                </div>
                <div>{selected.attachments}</div>
              </div>
              <div>
                <div className="finance-kv__label">
                  Approver
                </div>
                <div>—</div>
              </div>
            </div>
            <div>
              <div className="finance-kv__label">
                Amount
              </div>
              <div className="finance-kv__value finance-kv__value--strong" style={{ fontSize: 16 }}>
                {formatCurrency(selected.amount, selected.currency)}
              </div>
            </div>
            {selected.attachments === 0 ? (
              <div className="finance-callout" data-tone="warning">
                <div className="finance-callout__title">Missing attachments</div>
                <div className="finance-callout__body">
                  Request is likely blocked until supporting documents are added.
                </div>
              </div>
            ) : null}
            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
              <button className="btn ghost btn--sm" onClick={() => navigate(`/purchase-requests/${selected.id}`)}>
                Προβολή
              </button>
              <div className="row" style={{ flexWrap: "wrap" }}>
                <button
                  className="btn"
                  disabled={!perms.canApproveRequest || selected.status === "Rejected" || selected.status === "Cancelled"}
                  onClick={() => updatePurchaseRequestStatus(selected.id, "Returned for Changes")}
                  title={!perms.canApproveRequest ? "You don't have permission to approve requests." : undefined}
                >
                  Επιστροφή
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
                  className="btn ghost"
                  disabled={!perms.canApproveRequest || selected.status === "Rejected" || selected.status === "Cancelled"}
                  title={!perms.canApproveRequest ? "You don't have permission to approve requests." : undefined}
                  onClick={() => updatePurchaseRequestStatus(selected.id, "Rejected")}
                >
                  Απόρριψη
                </button>
              </div>
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

