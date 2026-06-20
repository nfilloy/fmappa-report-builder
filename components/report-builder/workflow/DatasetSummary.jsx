"use client";

import { CheckCircle2 } from "lucide-react";

export function DatasetSummary({ report, kpis }) {
  if (!report) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-5 text-sm leading-6 text-muted-foreground">
        Load an OCF or PCF CSV to unlock document editing, branding and export.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Dataset ready
          </p>
          <h2 className="mt-1 truncate text-lg font-semibold text-foreground">
            {report.fileName}
          </h2>
        </div>
        <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {kpis.slice(0, 4).map((kpi) => (
          <div className="rounded-lg bg-secondary/50 p-3" key={kpi.label}>
            <p className="truncate text-xs text-muted-foreground">{kpi.label}</p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">
              {kpi.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
