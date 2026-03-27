import React from "react";
import { Popover } from "./Popover";

export function FiltersBar({
  children,
  right,
  moreLabel = "More",
  morePlacement = "bottom-end",
  maxVisible = 3
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  moreLabel?: React.ReactNode;
  morePlacement?: "bottom-start" | "bottom-end";
  maxVisible?: number;
}) {
  const items = React.Children.toArray(children).filter(Boolean);
  const visible = items.slice(0, maxVisible);
  const overflow = items.slice(maxVisible);

  return (
    <div className="filters-bar">
      <div className="filters-bar__main">
        {visible.map((n, idx) => (
          <div key={idx} className="filters-bar__item">
            {n}
          </div>
        ))}
      </div>

      <div className="filters-bar__right">
        {right ? <div className="filters-bar__right-inner">{right}</div> : null}
        {overflow.length > 0 ? (
          <div className="filters-bar__more">
            <Popover
              placement={morePlacement}
              trigger={({ ref, onClick, "aria-expanded": ariaExpanded }) => (
                <button ref={ref} className="btn btn--sm" onClick={onClick} aria-expanded={ariaExpanded}>
                  {moreLabel}
                </button>
              )}
            >
              <div className="filters-more">
                {overflow.map((n, idx) => (
                  <div key={idx} className="filters-more__item">
                    {n}
                  </div>
                ))}
              </div>
            </Popover>
          </div>
        ) : null}
      </div>
    </div>
  );
}

