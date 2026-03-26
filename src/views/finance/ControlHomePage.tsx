import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { KpiCard } from "../../ui/KpiCard";
import { formatCurrency, formatInt } from "../../domain/format";
import { budgetLines, employeeCosts } from "../../mock/data";
import { useFinancePrototypeState } from "../../state/FinancePrototypeState";

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}

export function ControlHomePage() {
  const navigate = useNavigate();
  const { auditEvents } = useFinancePrototypeState();

  const totalCommitted = sum(budgetLines.map((b) => b.committed));
  const totalActualPaid = sum(budgetLines.map((b) => b.actualPaid));
  const warningLines = budgetLines.filter((b) => b.signal === "Warning").length;
  const breachLines = budgetLines.filter((b) => b.signal === "Breach").length;
  const exceptions = auditEvents.filter((e) => e.severity !== "Info").length;

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Έλεγχος</h1>
          <p>Εποπτεία και διακυβέρνηση: προϋπολογισμοί, κόστη και έλεγχος audit.</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => navigate("/finance/control/audit")}>
            Άνοιγμα audit
          </button>
          <button className="btn primary" onClick={() => navigate("/finance/control/budgets")}>
            Προϋπολογισμοί
          </button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <KpiCard
          label="Προειδοποιήσεις / υπερβάσεις"
          iconClass="bi-exclamation-triangle"
          value={formatInt(warningLines + breachLines)}
          currentValue={warningLines + breachLines}
          trendPreference="lower"
          referenceBias={0.02}
          sub={`${formatInt(warningLines)} προειδοποίηση, ${formatInt(breachLines)} υπέρβαση`}
          onClick={() => navigate("/finance/control/budgets")}
        />

        <KpiCard
          label="Δεσμευμένα vs πραγματικά"
          iconClass="bi-cash-stack"
          value={formatCurrency(totalCommitted)}
          currentValue={totalCommitted}
          trendPreference="lower"
          referenceBias={0.01}
          sub={`${formatCurrency(totalActualPaid)} πληρωθέντα`}
          onClick={() => navigate("/finance/control/budgets")}
        />

        <KpiCard
          label="Κόστη προσωπικού"
          iconClass="bi-people"
          value={formatInt(employeeCosts.length)}
          currentValue={employeeCosts.length}
          trendPreference="lower"
          referenceBias={0.03}
          sub="Γραμμές προσωπικού στην προβολή"
          onClick={() => navigate("/finance/control/employee-costs")}
        />
      </div>

      <div className="grid-2">
        <Card
          title="Γρήγοροι σύνδεσμοι"
          right={
            <div className="row">
              <Chip tone="neutral">{formatInt(budgetLines.length)} προϋπολογισμοί</Chip>
              <Chip tone="neutral">{formatInt(auditEvents.length)} συμβάντα audit</Chip>
            </div>
          }
        >
          <div className="finance-quicklinks">
            <button className="btn" onClick={() => navigate("/finance/control/budgets")}>
              Προϋπολογισμοί
            </button>
            <button className="btn" onClick={() => navigate("/finance/control/employee-costs")}>
              Κόστη προσωπικού
            </button>
            <button className="btn" onClick={() => navigate("/finance/control/audit")}>
              Audit
            </button>
          </div>
        </Card>

        <Card title="Εξαιρέσεις">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="muted">{formatInt(exceptions)} συμβάντα audit (μη ενημερωτικά).</div>
            <button className="btn" onClick={() => navigate("/finance/control/audit")}>
              Λεπτομέρειες
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}

