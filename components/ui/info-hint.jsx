"use client";

import { Info } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Small inline "ⓘ" affordance that explains a single adjustable parameter.
// Reuses the shared Radix Tooltip (the app-level TooltipProvider already wraps
// the workspace), so it is keyboard-focusable and opens on hover or focus.
// `label` is the accessible name read by assistive tech; `children` is the
// one-sentence explanation shown in the tooltip.
export function InfoHint({ label, children, className, side = "top" }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={label}
          className={cn(
            "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          type="button"
        >
          <Info aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs font-normal leading-snug" side={side}>
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
