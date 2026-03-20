import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { KpiCard } from "../../ui/KpiCard";
import { formatCurrency, formatInt } from "../../domain/format";
import { invoiceDrafts, invoices, receivables } from "../../mock/data";

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}

export function RevenueHomePage() {
  const navigate = useNavigate();

  const staleDrafts = invoiceDrafts.filter((d) => d.status === "Stale").length;
  const readyDrafts = invoiceDrafts.filter((d) => d.status === "Ready to Issue").length;

  const issued = invoices.filter((i) => i.status === "Issued").length;
  const partiallyPaid = invoices.filter((i) => i.status === "Partially Paid").length;
  const overdueReceivables = receivables.filter((r) => r.signal === "Overdue").length;
  const outstandingReceivables = sum(receivables.map((r) => r.outstanding));

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Έσοδα</h1>
          <p>Χρεώσιμη εργασία → πρόχειρο τιμολογίου → εκδοθείσα απαίτηση → είσπραξη.</p>
        </div>
        <div className="row">
          <button className="btn primary" onClick={() => navigate("/finance/revenue/drafts/builder")}>
            Νέο πρόχειρο
          </button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <KpiCard
          label="Πρόχειρα προς έλεγχο"
          iconClass="bi-journal-text"
          value={formatInt(staleDrafts)}
          currentValue={staleDrafts}
          trendPreference="lower"
          referenceBias={0.02}
          sub={`${formatInt(readyDrafts)} έτοιμα για έκδοση`}
          onClick={() => navigate("/finance/revenue/drafts?status=Stale")}
        />

        <KpiCard
          label="Εκδόθηκαν στην περίοδο"
          iconClass="bi-send"
          value={formatInt(issued)}
          currentValue={issued}
          trendPreference="higher"
          referenceBias={-0.02}
          sub={`${formatInt(partiallyPaid)} μερικώς εξοφλημένα`}
          onClick={() => navigate("/finance/revenue/invoices?status=Issued")}
        />

        <KpiCard
          label="Ληξιπρόθεσμες απαιτήσεις"
          iconClass="bi-exclamation-octagon"
          value={formatInt(overdueReceivables)}
          currentValue={overdueReceivables}
          trendPreference="lower"
          referenceBias={0.03}
          sub={`${formatCurrency(outstandingReceivables)} υπόλοιπο`}
          onClick={() => navigate("/finance/revenue/collections?signal=Overdue")}
        />
      </div>

      <div className="grid-2">
        <Card
          title="Γρήγοροι σύνδεσμοι"
          right={
            <div className="row">
              <Chip tone="neutral">{invoiceDrafts.length} πρόχειρα</Chip>
              <Chip tone="neutral">{invoices.length} τιμολόγια</Chip>
            </div>
          }
        >
          <div className="finance-quicklinks">
            <button className="btn" onClick={() => navigate("/finance/revenue/drafts")}>
              Πρόχειρα
            </button>
            <button className="btn" onClick={() => navigate("/finance/revenue/invoices")}>
              Τιμολόγια
            </button>
            <button className="btn" onClick={() => navigate("/finance/revenue/collections")}>
              Οφειλές
            </button>
          </div>
        </Card>

        <Card title="Εξαιρέσεις">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="muted">Οι ληξιπρόθεσμες απαιτήσεις χρειάζονται παρακολούθηση.</div>
            <button className="btn" onClick={() => navigate("/finance/revenue/collections?signal=Overdue")}>
              Λεπτομέρειες
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}

