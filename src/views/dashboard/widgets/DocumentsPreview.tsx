import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Chip } from "../../../ui/Chip";
import { formatCurrency } from "../../../domain/format";

export type DocumentDirection = "OUT" | "IN";

export type DocumentPreviewRow = {
  id: string;
  ref: string;
  counterparty: string;
  direction: DocumentDirection;
  statusLabel: string;
  statusTone: "neutral" | "warning" | "danger" | "success";
  dateLabel: string;
  amountLabel: string;
  to: string;
};

export function DocumentsPreview({
  rows,
  filter,
  onFilterChange
}: {
  rows: DocumentPreviewRow[];
  filter: "All" | DocumentDirection;
  onFilterChange: (f: "All" | DocumentDirection) => void;
}) {
  const navigate = useNavigate();

  const filtered = rows.filter((r) => (filter === "All" ? true : r.direction === filter));

  const viewAllTo = filter === "IN" ? "/finance/spend/bills" : "/finance/revenue/invoices";

  return (
    <div className="finance-stack" style={{ gap: 10 }}>
      <div className="finance-row finance-row--between finance-row--wrap">
        <div className="finance-row finance-row--wrap" style={{ gap: 8 }}>
          {(["All", "OUT", "IN"] as const).map((k) => (
            <button
              key={k}
              type="button"
              className={`chip ${filter === k ? "chip--active" : ""}`}
              onClick={() => onFilterChange(k)}
            >
              {k === "All" ? "Όλα" : k === "OUT" ? "Εξερχόμενα" : "Εισερχόμενα"}
            </button>
          ))}
        </div>
        <Link
          to={viewAllTo}
          className="btn btn--sm"
          aria-label="Προβολή όλων"
          title="Προβολή όλων"
        >
          <i className="bi bi-eye" aria-hidden="true" />
        </Link>
      </div>

      <div className="finance-table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Αναφορά</th>
              <th>Αντισυμβαλλόμενος</th>
              <th>Κατεύθυνση</th>
              <th>Κατάσταση</th>
              <th>Λήξη</th>
              <th className="num">Ποσό / Υπόλοιπο</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 5).map((r) => (
              <tr key={r.id} onClick={() => navigate(r.to)} className="finance-table-clickrow">
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.ref}</td>
                <td>{r.counterparty}</td>
                <td className="muted">
                  {r.direction === "OUT" ? "OUT · Πελάτης" : "IN · Προμηθευτής"}
                </td>
                <td>
                  <Chip tone={r.statusTone}>{r.statusLabel}</Chip>
                </td>
                <td className="muted">{r.dateLabel}</td>
                <td className="num">{r.amountLabel}</td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted" style={{ padding: 16 }}>
                  Δεν υπάρχουν παραστατικά για αυτό το φίλτρο.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

