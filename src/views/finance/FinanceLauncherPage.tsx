import React from "react";
import { useNavigate } from "react-router-dom";

type LauncherApp = {
  key: "overview" | "revenue" | "spend" | "control";
  title: string;
  to: string;
};

const APPS: LauncherApp[] = [
  {
    key: "overview",
    title: "Πίνακας Επισκόπησης",
    to: "/finance/overview"
  },
  {
    key: "revenue",
    title: "Κύκλος Εσόδων / Απαιτήσεων",
    to: "/finance/revenue"
  },
  {
    key: "spend",
    title: "Κύκλος Δαπανών / Υποχρεώσεων",
    to: "/finance/spend"
  },
  {
    key: "control",
    title: "Υποστηρικτικό επίπεδο ελέγχου",
    to: "/finance/control"
  }
];

export function FinanceLauncherPage() {
  const navigate = useNavigate();

  return (
    <>
      <div className="apps-category-title">Οικονομικά</div>
      <div className="finance-launcher">
        {APPS.map((app) => (
          <button
            key={app.key}
            className="finance-launcher__tile"
            type="button"
            onClick={() => navigate(app.to)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate(app.to);
            }}
          >
            <span className={`finance-launcher__icon finance-launcher__icon--${app.key}`} aria-hidden>
              {app.key === "revenue" || app.key === "spend" ? (
                <img
                  className="finance-launcher__img"
                  src={app.key === "revenue" ? "/assets/icons/revenue.png" : "/assets/icons/expenses.png"}
                  alt=""
                  aria-hidden
                />
              ) : (
                <i
                  className={`finance-launcher__bi bi ${
                    app.key === "control" ? "bi-shield-check" : "bi-grid"
                  }`}
                  aria-hidden
                />
              )}
            </span>
            <span className="finance-launcher__label">{app.title}</span>
          </button>
        ))}
      </div>
    </>
  );
}

