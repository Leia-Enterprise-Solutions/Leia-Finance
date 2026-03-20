import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { formatCurrency } from "../../domain/format";

type ActivityModule = "Revenue" | "Spend" | "Control";

type ActivityEvent = {
  id: string;
  timestamp: string;
  timeLabel: string;
  actor: string;
  action: string;
  targetType: string;
  targetRef: string;
  module: ActivityModule;
  contextLine?: string;
  amount?: number;
  linkedParty?: string;
  openTo: string;
};

const MOCK_ACTIVITY: ActivityEvent[] = [
  {
    id: "e1",
    timestamp: "2026-03-19T10:42:00",
    timeLabel: "10:42",
    actor: "Maria K.",
    action: "approved",
    targetType: "Purchase Request",
    targetRef: "PR-021",
    module: "Spend",
    contextLine: "Amount: 2.100 € · Department: Operations",
    amount: 2100,
    openTo: "/finance/spend/requests"
  },
  {
    id: "e2",
    timestamp: "2026-03-19T09:18:00",
    timeLabel: "09:18",
    actor: "Finance Operator",
    action: "issued",
    targetType: "Invoice",
    targetRef: "INV-204",
    module: "Revenue",
    contextLine: "Client: Alpha SA · Total: 4.800 €",
    amount: 4800,
    linkedParty: "Alpha SA",
    openTo: "/finance/revenue/invoices"
  },
  {
    id: "e3",
    timestamp: "2026-03-19T08:55:00",
    timeLabel: "08:55",
    actor: "Nikos P.",
    action: "recorded",
    targetType: "Supplier bill",
    targetRef: "BILL-118",
    module: "Spend",
    contextLine: "Studio Kappa · 2.100 €",
    amount: 2100,
    linkedParty: "Studio Kappa",
    openTo: "/finance/spend/bills"
  },
  {
    id: "e4",
    timestamp: "2026-03-18T16:30:00",
    timeLabel: "Χθες 16:30",
    actor: "System",
    action: "payment executed",
    targetType: "Payment",
    targetRef: "PAY-002",
    module: "Spend",
    contextLine: "Batch executed · 3 items",
    openTo: "/finance/spend/payments"
  },
  {
    id: "e5",
    timestamp: "2026-03-18T14:00:00",
    timeLabel: "Χθες 14:00",
    actor: "Alex",
    action: "updated",
    targetType: "Draft",
    targetRef: "DRAFT-007",
    module: "Revenue",
    contextLine: "Northwind Labs · lines revised",
    openTo: "/finance/revenue/drafts"
  },
  {
    id: "e6",
    timestamp: "2026-03-18T11:20:00",
    timeLabel: "Χθες 11:20",
    actor: "Iris",
    action: "collection note added",
    targetType: "Receivable",
    targetRef: "INV-2026-01002",
    module: "Revenue",
    contextLine: "Acme Holding · follow-up scheduled",
    openTo: "/finance/revenue/collections"
  },
  {
    id: "e7",
    timestamp: "2026-03-17T17:00:00",
    timeLabel: "Προηγ. 17:00",
    actor: "Finance",
    action: "budget revised",
    targetType: "Budget",
    targetRef: "OPEX-Q1",
    module: "Control",
    contextLine: "Line Marketing +5%",
    openTo: "/finance/control/budgets"
  },
  {
    id: "e8",
    timestamp: "2026-03-17T09:15:00",
    timeLabel: "Προηγ. 09:15",
    actor: "Mina",
    action: "submitted",
    targetType: "Purchase request",
    targetRef: "PR-022",
    module: "Spend",
    contextLine: "IT equipment · 1.200 €",
    amount: 1200,
    openTo: "/finance/spend/requests"
  }
];

type TimeGroup = "today" | "yesterday" | "week";

function getTimeGroup(ts: string): TimeGroup {
  const d = new Date(ts);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 7);
  if (d >= today) return "today";
  if (d >= yesterday) return "yesterday";
  return "week";
}

const GROUP_LABELS: Record<TimeGroup, string> = {
  today: "Σήμερα",
  yesterday: "Χθες",
  week: "Αυτή την εβδομάδα"
};

export function OverviewActivityTab() {
  const navigate = useNavigate();
  const [moduleFilter, setModuleFilter] = useState<ActivityModule | "All">("All");

  const filtered = useMemo(() => {
    if (moduleFilter === "All") return MOCK_ACTIVITY;
    return MOCK_ACTIVITY.filter((e) => e.module === moduleFilter);
  }, [moduleFilter]);

  const grouped = useMemo(() => {
    const today: ActivityEvent[] = [];
    const yesterday: ActivityEvent[] = [];
    const week: ActivityEvent[] = [];
    for (const e of filtered) {
      const g = getTimeGroup(e.timestamp);
      if (g === "today") today.push(e);
      else if (g === "yesterday") yesterday.push(e);
      else week.push(e);
    }
    return { today, yesterday, week };
  }, [filtered]);

  const summary = useMemo(() => {
    const t = filtered.filter((e) => getTimeGroup(e.timestamp) === "today").length;
    const y = filtered.filter((e) => getTimeGroup(e.timestamp) === "yesterday").length;
    const w = filtered.filter((e) => getTimeGroup(e.timestamp) === "week").length;
    return { today: t, yesterday: y, week: w };
  }, [filtered]);

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Πρόσφατη δραστηριότητα</h1>
          <p>Τι έγινε πρόσφατα στο σύστημα.</p>
        </div>
      </div>

      <div className="overview-activity-summary" style={{ marginBottom: 16 }}>
        <span className="muted">Περίοδος: </span>
        <Chip tone="neutral">Σήμερα: {summary.today}</Chip>
        <Chip tone="neutral">Χθες: {summary.yesterday}</Chip>
        <Chip tone="neutral">Αυτή την εβδομάδα: {summary.week}</Chip>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Card title="Φίλτρα">
        <div className="row" style={{ flexWrap: "wrap", gap: 12 }}>
          <span className="muted" style={{ fontSize: 12 }}>Module:</span>
          {(["All", "Revenue", "Spend", "Control"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`chip ${moduleFilter === m ? "chip--active" : ""}`}
              onClick={() => setModuleFilter(m)}
            >
              {m === "All" ? "Όλα" : m}
            </button>
          ))}
        </div>
      </Card>
      </div>

      <div className="overview-activity-list">
        {(grouped.today.length > 0 || grouped.yesterday.length > 0 || grouped.week.length > 0) ? (
          <>
            {grouped.today.length > 0 && (
              <section className="overview-activity-group" aria-labelledby="activity-today">
                <h2 id="activity-today" className="overview-section__title" style={{ marginBottom: 8 }}>
                  {GROUP_LABELS.today}
                </h2>
                <ul className="overview-activity-ul">
                  {grouped.today.map((e) => (
                    <ActivityRow key={e.id} event={e} onOpen={() => navigate(e.openTo)} />
                  ))}
                </ul>
              </section>
            )}
            {grouped.yesterday.length > 0 && (
              <section className="overview-activity-group" aria-labelledby="activity-yesterday">
                <h2 id="activity-yesterday" className="overview-section__title" style={{ marginBottom: 8 }}>
                  {GROUP_LABELS.yesterday}
                </h2>
                <ul className="overview-activity-ul">
                  {grouped.yesterday.map((e) => (
                    <ActivityRow key={e.id} event={e} onOpen={() => navigate(e.openTo)} />
                  ))}
                </ul>
              </section>
            )}
            {grouped.week.length > 0 && (
              <section className="overview-activity-group" aria-labelledby="activity-week">
                <h2 id="activity-week" className="overview-section__title" style={{ marginBottom: 8 }}>
                  {GROUP_LABELS.week}
                </h2>
                <ul className="overview-activity-ul">
                  {grouped.week.map((e) => (
                    <ActivityRow key={e.id} event={e} onOpen={() => navigate(e.openTo)} />
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : (
          <p className="muted" style={{ padding: 24 }}>
            Δεν υπάρχει δραστηριότητα για τα επιλεγμένα φίλτρα.
          </p>
        )}
      </div>
    </>
  );
}

function ActivityRow({ event, onOpen }: { event: ActivityEvent; onOpen: () => void }) {
  return (
    <li className="overview-activity-row">
      <div className="overview-activity-row__main">
        <div className="row" style={{ alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="muted" style={{ fontVariantNumeric: "tabular-nums" }}>
            {event.timeLabel}
          </span>
          <Chip tone="neutral">{event.module}</Chip>
          <span>
            <strong>{event.actor}</strong> {event.action}{" "}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{event.targetRef}</span>
          </span>
        </div>
        {event.contextLine && (
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            {event.contextLine}
            {event.amount != null && ` · ${formatCurrency(event.amount)}`}
          </div>
        )}
      </div>
      <div className="overview-activity-row__action">
        <button type="button" className="btn btn--sm" onClick={onOpen}>
          Άνοιγμα
        </button>
      </div>
    </li>
  );
}
