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
  const [project, setProject] = React.useState<string | "All">("All");
  const [period, setPeriod] = React.useState<string | "All">("All");

  const projects = React.useMemo(
    () => ["All", ...Array.from(new Set(allCosts.map((c) => c.project ?? "—")))],
    []
  );
  const periods = React.useMemo(() => ["All", ...Array.from(new Set(allCosts.map((c) => c.period)))], []);

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (!q.trim()) url.searchParams.delete("q");
    else url.searchParams.set("q", q.trim());
    navigate(`${loc.pathname}?${url.searchParams.toString()}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const filtered = allCosts
    .filter((c) => (project === "All" ? true : (c.project ?? "—") === project))
    .filter((c) => (period === "All" ? true : c.period === period))
    .filter((c) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return c.employee.toLowerCase().includes(needle) || c.team.toLowerCase().includes(needle);
  });

  const totals = React.useMemo(() => {
    const totalCost = filtered.reduce((a, c) => a + c.totalCost, 0);
    return { totalCost };
  }, [filtered]);

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Κόστος Προσωπικού</h1>
          <p>Labor cost visibility with billable vs non-billable split (operational, not accounting).</p>
        </div>
        <div className="row">
          <button className="btn">Permissions</button>
          <button className="btn primary">Export</button>
        </div>
      </div>

      <div className="invoice-filters-bar">
        <div className="invoice-filters-row">
          <div className="invoice-filters-main">
            <div className="field invoice-filter-field invoice-filter-field--wide">
            <label>Search</label>
            <input
              className="input"
              placeholder="Employee, team…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            </div>
            <div className="field invoice-filter-field">
              <label>Project</label>
              <select className="select" value={project} onChange={(e) => setProject(e.target.value)}>
                {projects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="field invoice-filter-field">
              <label>Period</label>
              <select className="select" value={period} onChange={(e) => setPeriod(e.target.value)}>
                {periods.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn ghost btn--sm"
              onClick={() => {
                setQ("");
                setProject("All");
                setPeriod("All");
              }}
              title="Εκκαθάριση φίλτρων"
            >
              <span>Εκκαθάριση</span>
            </button>
          </div>
          <div className="invoice-filters-right">
            <Chip tone="neutral">{filtered.length} rows</Chip>
          </div>
        </div>
      </div>

      <div className="finance-spacer" />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi">
          <div className="label">
            <span>Συνολικό κόστος</span>
          </div>
          <div className="value">{formatCurrency(totals.totalCost)}</div>
          <div className="sub">στην τρέχουσα προβολή</div>
        </div>
      </div>

      <Card title="Cost rows">
        <div className="finance-table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Εργαζόμενος</th>
                <th>Ομάδα</th>
                <th>Έργο</th>
                <th>Περίοδος</th>
                <th className="num">Συνολικό κόστος</th>
                <th className="num">Χρεώσιμο</th>
                <th className="num">Μη χρεώσιμο</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: EmployeeCostRow) => (
                <tr key={c.id}>
                  <td>{c.employee}</td>
                  <td className="muted">{c.team}</td>
                  <td className="muted">{c.project ?? "—"}</td>
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
                  <td colSpan={7} className="muted" style={{ padding: 16 }}>
                    Δεν βρέθηκαν εγγραφές κόστους προσωπικού.
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

