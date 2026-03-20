import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

export type FinanceSubnavItem = { to: string; label: string };

export function FinanceSubnav({
  items,
  getActive
}: {
  items: FinanceSubnavItem[];
  getActive?: (item: FinanceSubnavItem, location: { pathname: string; search: string }) => boolean;
}) {
  const location = useLocation();

  if (getActive) {
    return (
      <div className="finance-subnav" role="navigation" aria-label="Section navigation">
        {items.map((it) => {
          const active = getActive(it, location);
          return (
            <Link
              key={it.to}
              to={it.to}
              aria-current={active ? "page" : undefined}
            >
              {it.label}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="finance-subnav" role="navigation" aria-label="Section navigation">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.to.split("/").length <= 3}>
          {it.label}
        </NavLink>
      ))}
    </div>
  );
}

