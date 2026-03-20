import React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

type NavItem = { to: string; label: string; badge?: string };

const NAV: NavItem[] = [
  { to: "/finance", label: "Οικονομικά" }
];

export function AppShell() {
  const navigate = useNavigate();
  const loc = useLocation();

  React.useEffect(() => {
    if (loc.pathname === "/") navigate("/finance", { replace: true });
  }, [loc.pathname, navigate]);

  return (
    <div className="app-shell">
      <header className="app-shell__top">
        <div className="app-shell__top-inner">
          <NavLink to="/finance" className="brand" aria-label="Αρχική Leia Finance">
            <span className="brand__mark" aria-hidden />
            <span className="brand__name">Leia Finance</span>
          </NavLink>

          <nav className="nav" aria-label="Κύρια πλοήγηση">
            {NAV.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                aria-current={loc.pathname === it.to ? "page" : undefined}
              >
                {it.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="app-shell__content">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

