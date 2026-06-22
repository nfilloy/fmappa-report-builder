"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

function Tabs({
  "aria-label": ariaLabel,
  className,
  items,
  onValueChange,
  triggerClassName,
  value,
}) {
  // Unique per instance so the sliding indicator never animates between two
  // separate Tabs groups that happen to share the layout tree.
  const layoutId = React.useId();

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
              "relative min-w-0 rounded-md px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
              triggerClassName,
            )}
            disabled={item.disabled}
            key={item.value}
            onClick={() => onValueChange(item.value)}
            role="tab"
            type="button"
          >
            {active ? (
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 rounded-md bg-card shadow-sm"
                layoutId={`tab-pill-${layoutId}`}
                transition={{ type: "spring", stiffness: 480, damping: 38 }}
              />
            ) : null}
            <span className="relative z-10 block truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export { Tabs };
