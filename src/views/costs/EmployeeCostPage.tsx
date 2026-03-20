import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import type { EmployeeCostRow } from "../../domain/types";
import { employeeCosts as allCosts } from "../../mock/data";
import { formatCurrency } from "../../domain/format";
import { getStringParam } from "../../router/query";

function pct(n: number) {
  return `${Math.round(n)}%`;
}

export function EmployeeCostPage() {
  const navigate = useNavigate();
  const loc = useLocation();
  const params = React.useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const initialQ = getStringParam(params, "q");

  const [q, setQ] = React.useState(initialQ ?? "");

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (!q.trim()) url.searchParams.delete("q");
    else url.searchParams.set("q", q.trim());
    navigate(`${loc.pathname}?${url.searchParams.toString()}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const filtered = allCosts.filter((c) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return c.employee.toLowerCase().includes(needle) || c.team.toLowerCase().includes(needle);
  });

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Employee Cost</h1>
          <p>Labor cost visibility with billable vs non-billable split (operational, not accounting).</p>
        </div>
        <div className="row">
          <button className="btn">Permissions</button>
          <button className="btn primary">Export</button>
        </div>
      </div>

      <Card title="Filter">
        <div className="filters">
          <div className="field" style={{ minWidth: 240 }}>
            <label>Search</label>
            <input
              className="input"
              placeholder="Employee, team…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Chip tone="neutral">{filtered.length} rows</Chip>
        </div>
      </Card>

      <div style={{ height: 14 }} />

      <Card title="Cost rows">
        <div style={{ overflow: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Team</th>
                <th>Period</th>
                <th className="num">Total cost</th>
                <th className="num">Billable</th>
                <th className="num">Non-billable</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: EmployeeCostRow) => (
                <tr key={c.id}>
                  <td>{c.employee}</td>
                  <td className="muted">{c.team}</td>
                  <td className="muted">{c.period}</td>
                  <td className="num">{formatCurrency(c.totalCost, c.currency)}</td>
                  <td className="num">
                    <Chip tone={c.billablePct > 50 ? "success" : "neutral"}>{pct(c.billablePct)}</Chip>
                  </td>
                  <td className="num">
                    <Chip tone={c.nonBillablePct > 80 ? "warning" : "neutral"}>{pct(c.nonBillablePct)}</Chip>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted" style={{ padding: 16 }}>
                    No employee costs found.
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

