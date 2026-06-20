"use client";

import { Download, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ReportTopBar({
  enabledCount,
  onDownload,
  pdfLoading,
  report,
  settings,
  totalSections,
}) {
  if (!report) {
    return null;
  }

  return (
    <div className="sticky top-3 z-20 mt-2">
      <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border/50 bg-card/70 px-4 py-3 shadow-lg shadow-primary/5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FileText aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {settings.reportLabel || report.reportTitle}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {settings.clientName || report.clientName} · {report.coverBadge} ·{" "}
              {enabledCount}/{totalSections} sections included
            </p>
          </div>
        </div>
        <Button
          className="w-full sm:w-auto"
          disabled={pdfLoading}
          onClick={onDownload}
          size="sm"
          type="button"
          variant="gradient"
        >
          {pdfLoading ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <Download aria-hidden="true" />
          )}
          {pdfLoading ? "Generating" : "Download PDF"}
        </Button>
      </div>
    </div>
  );
}
