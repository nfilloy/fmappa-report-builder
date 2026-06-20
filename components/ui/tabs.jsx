import * as React from "react";

import { cn } from "@/lib/utils";

function Tabs({
  "aria-label": ariaLabel,
  className,
  items,
  onValueChange,
  triggerClassName,
  value,
}) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        "inline-flex min-w-0 items-center rounded-lg border border-border bg-secondary/70 p-1",
        className,
      )}
      role="tablist"
    >
      {items.map((item) => {
        const active = item.value === value;

        return (
          <button
            aria-selected={active}
            className={cn(
              "min-w-0 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
              active
                ? "bg-card text-foreground shadow-sm"
                : "hover:bg-card/60 hover:text-foreground",
              triggerClassName,
            )}
            disabled={item.disabled}
            key={item.value}
            onClick={() => onValueChange(item.value)}
            role="tab"
            type="button"
          >
            <span className="block truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export { Tabs };
