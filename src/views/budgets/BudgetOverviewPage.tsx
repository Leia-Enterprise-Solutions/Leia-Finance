import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import type { BudgetLine, BudgetSignal } from "../../domain/types";
import { budgetLines as allLines } from "../../mock/data";
import { formatCurrency } from "../../domain/format";
import { getEnumParam, getStringParam } from "../../router/query";

function toneForSignal(s: BudgetSignal) {
  if (s === "Healthy") return "success";
  if (s === "Warning") return "warning";
  return "danger";
}

function remaining(l: BudgetLine) {
  return l.budgeted - Math.max(l.committed, l.actualPaid);
}

function variance(l: BudgetLine) {
  // Blueprint UI: variance indicator based on committed + actual paid vs budgeted.
  return l.committed + l.actualPaid - l.budgeted;
}

export function BudgetOverviewPage() {
  const navigate = useNavigate();
  const loc = useLocation();
  const params = React.useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const initialDept = getStringParam(params, "dept");
  const initialProject = getStringParam(params, "project");
  const initialTask = getStringParam(params, "task");
  const initialSignal = getEnumParam<BudgetSignal>(params, "signal", ["Healthy", "Warning", "Breach"] as const);

  const [dept, setDept] = React.useState<string | "All">(initialDept ?? "All");
  const [project, setProject] = React.useState<string | "All">(initialProject ?? "All");
  const [task, setTask] = React.useState<string | "All">(initialTask ?? "All");
  const [signal, setSignal] = React.useState<BudgetSignal | "All">(initialSignal ?? "All");

  const departments = React.useMemo(
    () => ["All", ...Array.from(new Set(allLines.map((l) => l.department)))],
    []
  );
  const projects = React.useMemo(
    () => ["All", ...Array.from(new Set(allLines.map((l) => l.project ?? "—")))],
    []
  );
  const tasks = React.useMemo(
    () => ["All", ...Array.from(new Set(allLines.map((l) => l.task ?? "—")))],
    []
  );

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (dept === "All") url.searchParams.delete("dept");
    else url.searchParams.set("dept", dept);
    if (project === "All") url.searchParams.delete("project");
    else url.searchParams.set("project", project);
    if (task === "All") url.searchParams.delete("task");
    else url.searchParams.set("task", task);
    if (signal === "All") url.searchParams.delete("signal");
    else url.searchParams.set("signal", signal);
    navigate(`${loc.pathname}?${url.searchParams.toString()}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dept, project, task, signal]);

  const filtered = allLines
    .filter((l) => (dept === "All" ? true : l.department === dept))
    .filter((l) => (project === "All" ? true : (l.project ?? "—") === project))
    .filter((l) => (task === "All" ? true : (l.task ?? "—") === task))
    .filter((l) => (signal === "All" ? true : l.signal === signal));

  const totals = React.useMemo(() => {
    const budgeted = filtered.reduce((a, l) => a + l.budgeted, 0);
    const committed = filtered.reduce((a, l) => a + l.committed, 0);
    const actualPaid = filtered.reduce((a, l) => a + l.actualPaid, 0);
    return { budgeted, committed, actualPaid };
  }, [filtered]);

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Επισκόπηση Προϋπολογισμού</h1>
          <p>Προϋπολογισμένα vs δεσμεύσεις vs πληρωθέντα με καθαρό σήμα (healthy / warning / breach).</p>
        </div>
        <div className="row">
          <button className="btn" disabled>
            Version management (prototype)
          </button>
          <button className="btn primary" disabled>
            Publish (prototype)
          </button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi">
          <div className="label">
            <span>Προϋπολογισμένα</span>
          </div>
          <div className="value">{formatCurrency(totals.budgeted)}</div>
          <div className="sub">στην τρέχουσα προβολή</div>
        </div>
        <div className="kpi">
          <div className="label">
            <span>Δεσμεύσεις</span>
          </div>
          <div className="value">{formatCurrency(totals.committed)}</div>
          <div className="sub">δεσμεύσεις</div>
        </div>
        <div className="kpi">
          <div className="label">
            <span>Πληρωθέντα</span>
          </div>
          <div className="value">{formatCurrency(totals.actualPaid)}</div>
          <div className="sub">πληρωθέντα</div>
        </div>
      </div>

      <Card title="Φίλτρα">
        <div className="filters">
          <div className="field" style={{ minWidth: 220 }}>
            <label>Τμήμα</label>
            <select className="select" value={dept} onChange={(e) => setDept(e.target.value)}>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ minWidth: 220 }}>
            <label>Έργο</label>
            <select className="select" value={project} onChange={(e) => setProject(e.target.value)}>
              {projects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ minWidth: 220 }}>
            <label>Εργασία</label>
            <select className="select" value={task} onChange={(e) => setTask(e.target.value)}>
              {tasks.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ minWidth: 180 }}>
            <label>Σήμα</label>
            <select
              className="select"
              value={signal}
              onChange={(e) => setSignal(e.target.value as BudgetSignal | "All")}
            >
              <option value="All">Όλα</option>
              <option value="Healthy">Healthy</option>
              <option value="Warning">Warning</option>
              <option value="Breach">Breach</option>
            </select>
          </div>
          <Chip tone="neutral">{filtered.length} γραμμές</Chip>
          <Chip tone="danger">{filtered.filter((l) => l.signal === "Breach").length} breach</Chip>
        </div>
      </Card>

      <div className="finance-spacer" />

      <Card title="Γραμμές προϋπολογισμού">
        <div className="finance-table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Τμήμα</th>
                <th>Κατηγορία</th>
                <th>Έργο</th>
                <th>Εργασία</th>
                <th>Περίοδος</th>
                <th className="num">Προϋπολογισμένα</th>
                <th className="num">Δεσμεύσεις</th>
                <th className="num">Πληρωθέντα</th>
                <th className="num">Υπόλοιπο</th>
                <th className="num">Απόκλιση</th>
                <th>Σήμα</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td>{l.department}</td>
                  <td className="muted">{l.category}</td>
                  <td className="muted">{l.project ?? "—"}</td>
                  <td className="muted">{l.task ?? "—"}</td>
                  <td className="muted">{l.period}</td>
                  <td className="num">{formatCurrency(l.budgeted, l.currency)}</td>
                  <td className="num">{formatCurrency(l.committed, l.currency)}</td>
                  <td className="num">{formatCurrency(l.actualPaid, l.currency)}</td>
                  <td className="num">{formatCurrency(remaining(l), l.currency)}</td>
                  <td className="num">
                    {(() => {
                      const v = variance(l);
                      const pct = l.budgeted !== 0 ? (v / l.budgeted) * 100 : 0;
                      return `${formatCurrency(v, l.currency)} (${pct.toFixed(1)}%)`;
                    })()}
                  </td>
                  <td>
                    <Chip tone={toneForSignal(l.signal)}>{l.signal}</Chip>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="muted" style={{ padding: 16 }}>
                    No budget lines found for this selection.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

