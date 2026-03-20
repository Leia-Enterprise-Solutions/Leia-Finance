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

export function BudgetOverviewPage() {
  const navigate = useNavigate();
  const loc = useLocation();
  const params = React.useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const initialDept = getStringParam(params, "dept");
  const initialSignal = getEnumParam<BudgetSignal>(params, "signal", ["Healthy", "Warning", "Breach"] as const);

  const [dept, setDept] = React.useState<string | "All">(initialDept ?? "All");
  const [signal, setSignal] = React.useState<BudgetSignal | "All">(initialSignal ?? "All");

  const departments = React.useMemo(
    () => ["All", ...Array.from(new Set(allLines.map((l) => l.department)))],
    []
  );

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (dept === "All") url.searchParams.delete("dept");
    else url.searchParams.set("dept", dept);
    if (signal === "All") url.searchParams.delete("signal");
    else url.searchParams.set("signal", signal);
    navigate(`${loc.pathname}?${url.searchParams.toString()}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dept, signal]);

  const filtered = allLines
    .filter((l) => (dept === "All" ? true : l.department === dept))
    .filter((l) => (signal === "All" ? true : l.signal === signal));

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Budget Overview</h1>
          <p>Budgeted vs committed vs actual paid with clear signal (healthy / warning / breach).</p>
        </div>
        <div className="row">
          <button className="btn">New version</button>
          <button className="btn primary">Publish</button>
        </div>
      </div>

      <Card title="Filter">
        <div className="filters">
          <div className="field" style={{ minWidth: 220 }}>
            <label>Department</label>
            <select className="select" value={dept} onChange={(e) => setDept(e.target.value)}>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ minWidth: 180 }}>
            <label>Signal</label>
            <select
              className="select"
              value={signal}
              onChange={(e) => setSignal(e.target.value as BudgetSignal | "All")}
            >
              <option value="All">All</option>
              <option value="Healthy">Healthy</option>
              <option value="Warning">Warning</option>
              <option value="Breach">Breach</option>
            </select>
          </div>
          <Chip tone="neutral">{filtered.length} lines</Chip>
          <Chip tone="danger">{filtered.filter((l) => l.signal === "Breach").length} breach</Chip>
        </div>
      </Card>

      <div style={{ height: 14 }} />

      <Card title="Budget lines">
        <div style={{ overflow: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Category</th>
                <th>Period</th>
                <th className="num">Budgeted</th>
                <th className="num">Committed</th>
                <th className="num">Actual paid</th>
                <th className="num">Remaining</th>
                <th>Signal</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td>{l.department}</td>
                  <td className="muted">{l.category}</td>
                  <td className="muted">{l.period}</td>
                  <td className="num">{formatCurrency(l.budgeted, l.currency)}</td>
                  <td className="num">{formatCurrency(l.committed, l.currency)}</td>
                  <td className="num">{formatCurrency(l.actualPaid, l.currency)}</td>
                  <td className="num">{formatCurrency(remaining(l), l.currency)}</td>
                  <td>
                    <Chip tone={toneForSignal(l.signal)}>{l.signal}</Chip>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="muted" style={{ padding: 16 }}>
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

