"use client";

import Image from "next/image";

import { ReportDownloadButton } from "@/components/report-builder/ReportDownloadButton";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Single sticky app bar. It carries the Mappa brand at all times and, once a
// report is loaded, absorbs the report context + Download CTA so the workspace
// has one confident header instead of a hero row plus a floating top bar.
export function AppHeader({
  enabledCount,
  onDownload,
  onHome,
  pdfLoading,
  report,
  settings,
  totalSections,
}) {
  const hasReport = Boolean(report);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-8">
        <button
          aria-label="Footprint Mappa — back to start"
          className="flex min-w-0 shrink-0 items-center rounded-lg outline-none transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:opacity-80 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={onHome}
          type="button"
        >
          <Image
            src="/brand/logo-gradient.png"
            alt="Footprint Mappa"
            width={107}
            height={38}
            priority
            className="h-8 w-auto max-w-full object-contain dark:hidden"
          />
          <Image
            src="/brand/logo-white.png"
            alt="Footprint Mappa"
            width={107}
            height={38}
            priority
            className="hidden h-8 w-auto max-w-full object-contain dark:block"
          />
        </button>

        {hasReport ? (
          <div className="hidden min-w-0 flex-1 items-center border-l border-border/60 pl-4 md:flex">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {settings.reportLabel || report.reportTitle}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {settings.clientName || report.clientName} · {report.coverBadge} ·{" "}
                {enabledCount}/{totalSections} sections
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex shrink-0 items-center gap-2">
          {hasReport ? (
            <ReportDownloadButton
              onDownload={onDownload}
              pdfLoading={pdfLoading}
            />
          ) : null}
          <ThemeToggle className="shrink-0" />
        </div>
      </div>
    </header>
  );
}
