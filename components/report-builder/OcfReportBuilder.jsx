"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Download, Info, Leaf, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/report-builder/FileUpload";
import { KpiCards } from "@/components/report-builder/KpiCards";
import { ReportSettingsPanel } from "@/components/report-builder/ReportSettingsPanel";
import { SectionControls } from "@/components/report-builder/SectionControls";
import { ScopeDonut } from "@/components/report-builder/charts/ScopeDonut";
import { SiteEmissionsTable } from "@/components/report-builder/SiteEmissionsTable";
import { TopCategories } from "@/components/report-builder/TopCategories";
import { HtmlReport } from "@/components/report-html/HtmlReport";
import { buildOcfReport } from "@/lib/data/ocf";
import { parseCsv } from "@/lib/data/parseCsv";
import { formatPercent } from "@/lib/formatters";
import { BRAND, SCOPE_COLORS } from "@/lib/report/chartTheme";
import { HTML_REPORT_STYLES } from "@/lib/report/htmlReportStyles";
import {
  applyPreset,
  buildReportSections,
  createCustomSection,
  removeSection,
  updateSection,
} from "@/lib/report/sections";

export function OcfReportBuilder() {
  const [report, setReport] = useState(null);
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [settings, setSettings] = useState({
    clientName: "RELATS S.A.U.",
    reportLabel: "Organisational Carbon Footprint Report 2024",
    accentColor: "#b91c1c",
    reportYear: "2024",
    preparedBy: "Footprint Mappa",
    reportingPeriod: "",
    notes: "",
    logoDataUrl: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  function ingestCsv(text, fileName) {
    const rows = parseCsv(text);
    const nextReport = buildOcfReport(rows, fileName);
    const nextSections = buildReportSections(nextReport);
    setReport(nextReport);
    setSections(nextSections);
    setSelectedSectionId(nextSections[0]?.id || "");
    setSettings((currentSettings) => ({
      ...currentSettings,
      clientName: nextReport.clientName,
    }));
  }

  async function handleFileSelected(file) {
    setError("");
    setReport(null);
    setSections([]);
    setSelectedSectionId("");

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
      ingestCsv(text, file.name);
    } catch (nextError) {
      setError(nextError.message || "The CSV could not be parsed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadSample() {
    setError("");
    setReport(null);
    setSections([]);
    setSelectedSectionId("");
    setLoading(true);

    try {
      const response = await fetch("/sample_ocf_iso_14064.csv");

      if (!response.ok) {
        throw new Error("The sample CSV could not be loaded.");
      }

      const text = await response.text();
      ingestCsv(text, "sample_ocf_iso_14064.csv");
    } catch (nextError) {
      setError(nextError.message || "The sample CSV could not be loaded.");
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

  function handleReorderSections(nextSections) {
    setSections(nextSections);
  }

  function handleAddSection() {
    setSections((currentSections) => {
      const customCount = currentSections.filter(
        (section) => section.removable,
      ).length;
      const newSection = createCustomSection(customCount);
      setSelectedSectionId(newSection.id);
      return [...currentSections, newSection];
    });
  }

  function handleRemoveSection(sectionId) {
    setSections((currentSections) => {
      const nextSections = removeSection(currentSections, sectionId);
      setSelectedSectionId((currentSelected) =>
        currentSelected === sectionId
          ? nextSections[0]?.id || ""
          : currentSelected,
      );
      return nextSections;
    });
  }

  function handleApplyPreset(presetId) {
    setSections((currentSections) => applyPreset(currentSections, presetId));
  }

  function handleUpdateSection(sectionId, updates) {
    setSections((currentSections) =>
      updateSection(currentSections, sectionId, updates),
    );
  }

  function handleRestoreSections() {
    if (!report) {
      return;
    }

    const restoredSections = buildReportSections(report);
    setSections(restoredSections);
    setSelectedSectionId(restoredSections[0]?.id || "");
  }

  const kpis = useMemo(() => {
    if (!report) {
      return [];
    }

    return [
      {
        label: "Total emissions",
        value: report.total.totalEmissions,
        detail:
          report.totalSource === "official"
            ? "Official Total empresa row"
            : "Calculated from site rows",
        color: BRAND.navy,
      },
      {
        label: "Scope 1",
        value: report.total.scope1,
        detail: formatPercent(report.scopeBreakdown[0].percentage),
        color: SCOPE_COLORS[0],
      },
      {
        label: "Scope 2",
        value: report.total.scope2,
        detail: formatPercent(report.scopeBreakdown[1].percentage),
        color: SCOPE_COLORS[1],
      },
      {
        label: "Scope 3",
        value: report.total.scope3,
        detail: formatPercent(report.scopeBreakdown[2].percentage),
        color: SCOPE_COLORS[2],
      },
    ];
  }, [report]);

  return (
    <main className="app-dune-bg min-h-screen text-foreground">
      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        <div className="mappa-hero-gradient flex flex-col gap-6 px-1 py-8 sm:px-2 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <Image
              src="/brand/logo-gradient.png"
              alt="Footprint Mappa"
              width={107}
              height={38}
              priority
              className="h-9 w-auto"
            />
            <h1 className="mt-6 max-w-xl text-4xl font-bold leading-[1.02] tracking-tighter sm:text-6xl">
              <span className="text-foreground">OCF </span>
              <span className="mappa-text-gradient">Report Builder</span>
            </h1>
            <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">
              Upload an organisational carbon footprint CSV to generate a live
              report preview with charts, configurable sections and a polished
              PDF export.
            </p>
          </div>
          {report ? (
            <Button
              disabled={pdfLoading}
              onClick={handleDownloadPdf}
              size="lg"
              variant="gradient"
              className="shrink-0"
            >
              {pdfLoading ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : (
                <Download aria-hidden="true" />
              )}
              {pdfLoading ? "Generating PDF" : "Download PDF"}
            </Button>
          ) : null}
        </div>

        <div className="grid gap-6 py-8 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-4">
            <FileUpload
              onFileSelected={handleFileSelected}
              onLoadSample={handleLoadSample}
              fileName={report?.fileName}
            />
            {loading ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                Parsing CSV
              </div>
            ) : null}
            {error ? (
              <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-6 text-destructive">
                <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            ) : null}
            {report?.totalSource === "calculated" ? (
              <div className="flex gap-3 rounded-xl border border-mappa-peach/40 bg-accent/60 p-4 text-sm leading-6 text-accent-foreground">
                <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                No Total empresa row was found. Totals are calculated from site rows.
              </div>
            ) : null}
            {report ? (
              <ReportSettingsPanel onChange={setSettings} settings={settings} />
            ) : null}
            {report ? (
              <SectionControls
                onAddSection={handleAddSection}
                onApplyPreset={handleApplyPreset}
                onRemoveSection={handleRemoveSection}
                onReorderSections={handleReorderSections}
                onRestoreSections={handleRestoreSections}
                onSelectSection={setSelectedSectionId}
                onToggleSection={handleToggleSection}
                onUpdateSection={handleUpdateSection}
                sections={sections}
                selectedSectionId={selectedSectionId}
              />
            ) : null}
          </aside>

          <AnimatePresence mode="wait">
            {report ? (
              <motion.div
                key="report"
                className="space-y-6"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <KpiCards kpis={kpis} />
                <div className="grid gap-6 xl:grid-cols-2">
                  <ScopeDonut
                    scopes={report.scopeBreakdown}
                    total={report.total.totalEmissions}
                  />
                  <TopCategories categories={report.topScope3Categories} />
                </div>
                <SiteEmissionsTable sites={report.sites} />
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>HTML report preview</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      This preview is the source of truth for the Playwright PDF export.
                    </p>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <div className="max-h-[820px] overflow-auto bg-secondary p-4">
                      <style>{HTML_REPORT_STYLES}</style>
                      <HtmlReport report={report} sections={sections} settings={settings} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/30 p-8 text-center"
              >
                <div>
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Leaf aria-hidden="true" className="h-7 w-7" />
                  </span>
                  <h2 className="mt-5 text-xl font-semibold text-foreground">
                    No report loaded
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                    Select a CSV with the required OCF columns to preview totals,
                    scope breakdowns, site emissions and Scope 3 hotspots.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}
