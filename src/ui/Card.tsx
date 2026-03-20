import React from "react";

export function Card({
  title,
  right,
  children
}: {
  title?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      {title ? (
        <div className="card-h">
          <div style={{ fontWeight: 650 }}>{title}</div>
          {right ? <div>{right}</div> : null}
        </div>
      ) : null}
      <div className="card-b">{children}</div>
    </section>
  );
}

