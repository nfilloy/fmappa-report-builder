"use client";

import { useMemo, useState } from "react";
import { FileText, Info, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/report-builder/FileUpload";
import { ReportSettingsPanel } from "@/components/report-builder/ReportSettingsPanel";
import { SectionControls } from "@/components/report-builder/SectionControls";
import { ScopeBreakdown } from "@/components/report-builder/ScopeBreakdown";
import { SiteEmissionsTable } from "@/components/report-builder/SiteEmissionsTable";
import { TopCategories } from "@/components/report-builder/TopCategories";
import { HtmlReport } from "@/components/report-html/HtmlReport";
import { buildOcfReport } from "@/lib/data/ocf";
import { parseCsv } from "@/lib/data/parseCsv";
import { formatPercent, formatTonnes } from "@/lib/formatters";
import { HTML_REPORT_STYLES } from "@/lib/report/htmlReportStyles";
import { buildReportSections, reorderSection } from "@/lib/report/sections";

export function OcfReportBuilder() {
  const [report, setReport] = useState(null);
  const [sections, setSections] = useState([]);
  const [settings, setSettings] = useState({
    clientName: "RELATS S.A.U.",
    reportLabel: "Configurable OCF report",
    accentColor: "#0891b2",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  async function handleFileSelected(file) {
    setError("");
    setReport(null);
    setSections([]);

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a .csv file.");
      return;
    }

    setLoading(true);

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const nextReport = buildOcfReport(rows, file.name);
      setReport(nextReport);
      setSections(buildReportSections(nextReport));
      setSettings((currentSettings) => ({
        ...currentSettings,
        clientName: nextReport.clientName,
      }));
    } catch (nextError) {
      setError(nextError.message || "The CSV could not be parsed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPdf() {
    if (!report) {
      return;
    }

    setError("");
    setPdfLoading(true);

    try {
      const response = await fetch("/api/pdf", {
        body: JSON.stringify({ report, sections, settings }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "The PDF could not be generated.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ocf-report-2024.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (nextError) {
      setError(nextError.message || "The PDF could not be generated.");
    } finally {
      setPdfLoading(false);
    }
  }

  function handleToggleSection(sectionId) {
    setSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId
          ? { ...section, enabled: !section.enabled }
          : section,
      ),
    );
  }

  function handleMoveSection(sectionId, direction) {
    setSections((currentSections) =>
      reorderSection(currentSections, sectionId, direction),
    );
  }

  const kpis = useMemo(() => {
    if (!report) {
      return [];
    }

    return [
      { label: "Total emissions", value: formatTonnes(report.total.totalEmissions), detail: report.totalSource === "official" ? "Official Total empresa row" : "Calculated from site rows" },
      { label: "Scope 1", value: formatTonnes(report.total.scope1), detail: formatPercent(report.scopeBreakdown[0].percentage) },
      { label: "Scope 2", value: formatTonnes(report.total.scope2), detail: formatPercent(report.scopeBreakdown[1].percentage) },
      { label: "Scope 3", value: formatTonnes(report.total.scope3), detail: formatPercent(report.scopeBreakdown[2].percentage) },
    ];
  }, [report]);

  return (
    <main className="min-h-screen bg-neutral-950 text-foreground">
      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        <div className="flex flex-col gap-6 border-b border-neutral-800 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3 text-sm font-medium uppercase text-cyan-300">
              <FileText aria-hidden="true" className="h-5 w-5" />
              Footprint Mappa
            </div>
            <h1 className="mt-5 text-3xl font-semibold leading-tight text-white sm:text-4xl">
              OCF report builder
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
              Upload a compatible organisational carbon footprint CSV to generate a browser preview and a simple PDF report.
            </p>
          </div>
          {report ? (
            <Button disabled={pdfLoading} onClick={handleDownloadPdf}>
              <FileText aria-hidden="true" />
              {pdfLoading ? "Generating PDF" : "Download PDF"}
            </Button>
          ) : null}
        </div>

        <div className="grid gap-6 py-8 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-4">
            <FileUpload onFileSelected={handleFileSelected} fileName={report?.fileName} />
            {loading ? (
              <div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-300">
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                Parsing CSV
              </div>
            ) : null}
            {error ? (
              <div className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm leading-6 text-red-200">
                {error}
              </div>
            ) : null}
            {report?.totalSource === "calculated" ? (
              <div className="flex gap-3 rounded-lg border border-amber-900 bg-amber-950/30 p-4 text-sm leading-6 text-amber-100">
                <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                No Total empresa row was found. Totals are calculated from site rows.
              </div>
            ) : null}
            {report ? (
              <ReportSettingsPanel
                onChange={setSettings}
                settings={settings}
              />
            ) : null}
            {report ? (
              <SectionControls
                onMoveSection={handleMoveSection}
                onToggleSection={handleToggleSection}
                sections={sections}
              />
            ) : null}
          </aside>

          {report ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((kpi) => (
                  <div key={kpi.label} className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                    <p className="text-sm text-neutral-400">{kpi.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{kpi.value}</p>
                    <p className="mt-2 text-sm text-cyan-200">{kpi.detail}</p>
                  </div>
                ))}
              </div>
              <ScopeBreakdown scopes={report.scopeBreakdown} />
              <SiteEmissionsTable sites={report.sites} />
              <TopCategories categories={report.topScope3Categories} />
              <section className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
                <div className="border-b border-neutral-800 px-5 py-4">
                  <h2 className="text-lg font-semibold text-white">
                    HTML report preview
                  </h2>
                  <p className="mt-1 text-sm text-neutral-400">
                    This preview is the source of truth for the Playwright PDF export.
                  </p>
                </div>
                <div className="max-h-[820px] overflow-auto bg-neutral-200 p-4">
                  <style>{HTML_REPORT_STYLES}</style>
                  <HtmlReport report={report} sections={sections} settings={settings} />
                </div>
              </section>
            </div>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 p-8 text-center">
              <div>
                <FileText aria-hidden="true" className="mx-auto h-10 w-10 text-neutral-500" />
                <h2 className="mt-4 text-xl font-semibold text-white">No report loaded</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-neutral-400">
                  Select a CSV with the required OCF columns to preview totals, scope breakdowns, site emissions and Scope 3 hotspots.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
