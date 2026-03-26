import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { KpiCard } from "../../ui/KpiCard";
import { formatCurrency, formatInt } from "../../domain/format";
import { useFinancePrototypeState } from "../../state/FinancePrototypeState";

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}

export function SpendHomePage() {
  const navigate = useNavigate();
  const { purchaseRequests, supplierBills, paymentsQueue } = useFinancePrototypeState();

  const openRequests = purchaseRequests.filter((r) => r.status === "Submitted").length;
  const needsChangesRequests = purchaseRequests.filter((r) => r.status === "Submitted" && r.attachments === 0).length;
  const blockedBills = supplierBills.filter((b) => b.status === "Blocked").length;
  const overduePayables = supplierBills.filter((b) => b.status === "Overdue").length;
  const readyPayables = supplierBills.filter((b) => b.status === "Ready").length;

  const outstandingPayables = sum(supplierBills.filter((b) => b.status !== "Paid").map((b) => b.amount));
  const queueBlocked = paymentsQueue.filter((p) => p.readiness === "Blocked").length;

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Δαπάνες</h1>
          <p>Αίτημα αγοράς → εγκεκριμένη δέσμευση → τιμολόγιο προμηθευτή → πληρωμή.</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => navigate("/finance/spend/requests")}>
            Νέο αίτημα
          </button>
          <button className="btn primary" onClick={() => navigate("/finance/spend/payments")}>
            Άνοιγμα ουράς
          </button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <KpiCard
          label="Ανοικτά αιτήματα"
          iconClass="bi-file-earmark-text"
          value={formatInt(openRequests)}
          currentValue={openRequests}
          trendPreference="lower"
          referenceBias={0.01}
          sub={`${formatInt(needsChangesRequests)} χρειάζονται αλλαγές`}
          onClick={() => navigate("/finance/spend/requests")}
        />

        <KpiCard
          label="Μπλοκαρισμένα τιμολόγια"
          iconClass="bi-slash-circle"
          value={formatInt(blockedBills)}
          currentValue={blockedBills}
          trendPreference="lower"
          referenceBias={0.04}
          sub={`${formatInt(queueBlocked)} μπλοκαρισμένα στην ουρά`}
          onClick={() => navigate("/finance/spend/bills?status=Blocked")}
        />

        <KpiCard
          label="Έτοιμα / ληξιπρόθεσμα"
          iconClass="bi-calendar-event"
          value={formatInt(readyPayables + overduePayables)}
          currentValue={readyPayables + overduePayables}
          trendPreference="lower"
          referenceBias={0.02}
          sub={`${formatCurrency(outstandingPayables)} υπόλοιπο`}
          onClick={() => navigate("/finance/spend/bills?status=Overdue")}
        />
      </div>

      <div className="grid-2">
        <Card
          title="Γρήγοροι σύνδεσμοι"
          right={
            <div className="row">
              <Chip tone="neutral">{formatInt(purchaseRequests.length)} αιτήματα</Chip>
              <Chip tone="neutral">{formatInt(supplierBills.length)} τιμολόγια</Chip>
            </div>
          }
        >
          <div className="finance-quicklinks">
            <button className="btn" onClick={() => navigate("/finance/spend/requests")}>
              Αιτήματα
            </button>
            <button className="btn" onClick={() => navigate("/finance/spend/bills")}>
              Τιμολόγια
            </button>
            <button className="btn" onClick={() => navigate("/finance/spend/payments")}>
              Ουρά πληρωμών
            </button>
          </div>
        </Card>

        <Card title="Εξαιρέσεις">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="muted">Τα ληξιπρόθεσμα και τα μπλοκαρισμένα τιμολόγια είναι ρίσκο εκτέλεσης.</div>
            <button className="btn" onClick={() => navigate("/finance/spend/bills?status=Overdue")}>
              Λεπτομέρειες
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}

