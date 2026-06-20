"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Download, Info, Leaf, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressiveFluxLoader } from "@/components/ui/progressive-flux-loader";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Typewriter } from "@/components/ui/typewriter-text";
import { FileUpload } from "@/components/report-builder/FileUpload";
import { KpiCards } from "@/components/report-builder/KpiCards";
import { ReportSettingsPanel } from "@/components/report-builder/ReportSettingsPanel";
import { SectionControls } from "@/components/report-builder/SectionControls";
import { ScopeDonut } from "@/components/report-builder/charts/ScopeDonut";
import { SiteEmissionsTable } from "@/components/report-builder/SiteEmissionsTable";
import { TopCategories } from "@/components/report-builder/TopCategories";
import { HtmlReport } from "@/components/report-html/HtmlReport";
import { buildReport } from "@/lib/data/detectReportType";
import { parseCsv } from "@/lib/data/parseCsv";
import { formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/report/chartTheme";
import { themeReport } from "@/lib/report/palette";
import { HTML_REPORT_STYLES } from "@/lib/report/htmlReportStyles";
import {
  applyPreset,
  buildReportSections,
  createCustomSection,
  getSectionPresets,
  removeSection,
  updateSection,
} from "@/lib/report/sections";

const PDF_LOADER_PHASES = [
  { at: 0, label: "preparing report" },
  { at: 35, label: "rendering pages" },
  { at: 70, label: "building pdf" },
  { at: 92, label: "starting download" },
];

const SAMPLE_FILES = {
  ocf: "/sample_ocf_iso_14064.csv",
  pcf: "/sample_pcf_iso_14067.csv",
};

function buildKpis(report, palette) {
  if (!report) {
    return [];
  }

  const breakdownForKpis =
    report.kind === "pcf"
      ? [...report.breakdown].sort((a, b) => b.value - a.value).slice(0, 3)
      : report.breakdown;

  return [
    {
      label: "Total emissions",
      value: report.total.totalEmissions,
      detail: report.totalSourceLabel,
      color: palette?.[0] || BRAND.navy,
    },
    ...breakdownForKpis.map((item) => ({
      label: item.label,
      value: item.value,
      detail: formatPercent(item.percentage),
      color: item.color,
    })),
  ];
}

export function ReportBuilder() {
  const [report, setReport] = useState(null);
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [settings, setSettings] = useState({
    clientName: "RELATS S.A.U.",
    reportLabel: "Organisational Carbon Footprint Report 2024",
    accentColor: "#b91c1c",
    reportYear: "2024",
    preparedBy: "Footprint Mappa",
    preparedFor: "",
    reportDate: "",
    subtitle: "",
    totalSourceLabel: "",
    reportingPeriod: "",
    notes: "",
    logoDataUrl: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const ingestCsv = useCallback((text, fileName) => {
    const rows = parseCsv(text);
    const nextReport = buildReport(rows, fileName);
    const nextSections = buildReportSections(nextReport);
    setReport(nextReport);
    setSections(nextSections);
    setSelectedSectionId(nextSections[0]?.id || "");
    setSettings((currentSettings) => ({
      ...currentSettings,
      clientName: nextReport.clientName,
      reportLabel: nextReport.reportTitle,
    }));
  }, []);

  const resetReportState = useCallback(() => {
    setError("");
    setReport(null);
    setSections([]);
    setSelectedSectionId("");
  }, []);

  const handleFileSelected = useCallback(async (file) => {
    resetReportState();

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
  }, [ingestCsv, resetReportState]);

  const handleLoadSample = useCallback(async (kind) => {
    resetReportState();
    setLoading(true);

    const url = SAMPLE_FILES[kind];
    const sampleName = url.split("/").pop();

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("The sample CSV could not be loaded.");
      }

      const text = await response.text();
      ingestCsv(text, sampleName);
    } catch (nextError) {
      setError(nextError.message || "The sample CSV could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [ingestCsv, resetReportState]);

  const handleLoadSampleOcf = useCallback(() => handleLoadSample("ocf"), [handleLoadSample]);
  const handleLoadSamplePcf = useCallback(() => handleLoadSample("pcf"), [handleLoadSample]);

  const themedReport = useMemo(
    () => themeReport(report, settings.palette),
    [report, settings.palette],
  );
  const kpis = useMemo(
    () => buildKpis(themedReport, settings.palette),
    [themedReport, settings.palette],
  );

  const handleDownloadPdf = useCallback(async () => {
    if (!report) {
      return;
    }

    setError("");
    setPdfLoading(true);

    try {
      const response = await fetch("/api/pdf", {
        body: JSON.stringify({ report: themedReport, sections, settings }),
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
      link.download = `${report.kind}-report-${settings.reportYear || "2024"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (nextError) {
      setError(nextError.message || "The PDF could not be generated.");
    } finally {
      setPdfLoading(false);
    }
  }, [report, sections, settings, themedReport]);

  const handleToggleSection = useCallback((sectionId) => {
    setSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId
          ? { ...section, enabled: !section.enabled }
          : section,
      ),
    );
  }, []);

  const handleReorderSections = useCallback((nextSections) => {
    setSections(nextSections);
  }, []);

  const handleAddSection = useCallback(() => {
    setSections((currentSections) => {
      const customCount = currentSections.filter(
        (section) => section.removable,
      ).length;
      const newSection = createCustomSection(customCount);
      setSelectedSectionId(newSection.id);
      return [...currentSections, newSection];
    });
  }, []);

  const handleRemoveSection = useCallback((sectionId) => {
    setSections((currentSections) => {
      const nextSections = removeSection(currentSections, sectionId);
      setSelectedSectionId((currentSelected) =>
        currentSelected === sectionId
          ? nextSections[0]?.id || ""
          : currentSelected,
      );
      return nextSections;
    });
  }, []);

  const handleApplyPreset = useCallback((presetId) => {
    setSections((currentSections) =>
      applyPreset(currentSections, presetId, report?.kind),
    );
  }, [report?.kind]);

  const handleUpdateSection = useCallback((sectionId, updates) => {
    setSections((currentSections) =>
      updateSection(currentSections, sectionId, updates),
    );
  }, []);

  const handleRestoreSections = useCallback(() => {
    if (!report) {
      return;
    }

    const restoredSections = buildReportSections(report);
    setSections(restoredSections);
    setSelectedSectionId(restoredSections[0]?.id || "");
  }, [report]);

  const tableTitle = report?.kind === "pcf" ? "Product emissions" : "Site emissions";
  const calculatedNotice =
    report?.kind === "ocf" && report.totalSource === "calculated";
  const sectionPresets = useMemo(
    () => (report ? getSectionPresets(report.kind) : {}),
    [report],
  );

  return (
    <main className="app-dune-bg min-h-screen overflow-x-clip text-foreground">
      <section
        className={cn(
          "mx-auto w-full max-w-6xl px-4 sm:px-8",
          report
            ? "py-8"
            : "flex min-h-dvh flex-col py-[clamp(1rem,2.5vh,2rem)]",
        )}
      >
        <div
          className={cn(
            "mappa-hero-gradient flex min-w-0 flex-col px-1 sm:px-2",
            report
              ? "gap-6 py-8"
              : "gap-[clamp(0.75rem,2.2vh,1.5rem)] py-[clamp(0.5rem,1.5vh,1.5rem)]",
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <Image
              src="/brand/logo-gradient.png"
              alt="Footprint Mappa"
              width={107}
              height={38}
              priority
              className="h-9 max-w-full object-contain"
            />
            <ThemeToggle className="shrink-0" />
          </div>
          <div className="flex min-w-0 flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0 max-w-xl">
              <h1 className="max-w-xl text-[clamp(2.35rem,1.75rem+2vw,3.75rem)] font-bold leading-[1.02]">
                <span className="text-foreground">Report Builder </span>
                <Typewriter
                  text={["OCF.", "PCF."]}
                  loop
                  speed={130}
                  deleteSpeed={80}
                  delay={2000}
                  cursor="|"
                  className="mappa-text-gradient"
                  cursorClassName="text-mappa-coral"
                  containerClassName="min-w-[4ch] justify-start align-baseline"
                />
              </h1>
              <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">
                Upload an organisational (OCF) or product (PCF) carbon footprint CSV
                to generate a live report preview with charts, configurable sections
                and a polished PDF export.
              </p>
            </div>
            {report ? (
              <Button
                disabled={pdfLoading}
                onClick={handleDownloadPdf}
                size="lg"
                variant="gradient"
                className="w-full shrink-0 md:w-auto"
              >
                {pdfLoading ? (
                  <span className="h-4 w-16">
                    <ProgressiveFluxLoader
                      duration={3}
                      showLabel={false}
                      barClassName="h-4 bg-white/25"
                      className="max-w-none gap-0"
                    />
                  </span>
                ) : (
                  <Download aria-hidden="true" />
                )}
                {pdfLoading ? "Generating PDF" : "Download PDF"}
              </Button>
            ) : null}
          </div>
          <AnimatePresence>
            {pdfLoading ? (
              <motion.div
                key="pdf-loader"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-border/70 bg-card/80 px-5 py-5 shadow-sm backdrop-blur"
              >
                <ProgressiveFluxLoader
                  duration={10}
                  phases={PDF_LOADER_PHASES}
                  textClassName="text-base sm:text-lg"
                  barClassName="h-3"
                  className="max-w-lg gap-4 [--flux-from:#041282] [--flux-to:#74e1ff]"
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div
          className={cn(
            "grid min-w-0 gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]",
            report
              ? "py-8"
              : "min-h-0 flex-1 py-[clamp(1rem,2.5vh,2rem)] lg:[grid-template-rows:minmax(0,1fr)]",
          )}
        >
          <aside
            className={cn(
              "min-w-0 space-y-4",
              report ? null : "lg:flex lg:h-full lg:flex-col lg:gap-4 lg:space-y-0",
            )}
          >
            <FileUpload
              onFileSelected={handleFileSelected}
              onLoadSampleOcf={handleLoadSampleOcf}
              onLoadSamplePcf={handleLoadSamplePcf}
              fileName={report?.fileName}
              fill={!report}
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
            {calculatedNotice ? (
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
                presets={sectionPresets}
                sections={sections}
                selectedSectionId={selectedSectionId}
              />
            ) : null}
          </aside>

          <AnimatePresence mode="wait">
            {report ? (
              <motion.div
                key="report"
                className="min-w-0 space-y-6"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <KpiCards kpis={kpis} unit={report.unit} />
                <div className="grid min-w-0 gap-6 xl:grid-cols-2">
                  <ScopeDonut
                    breakdown={themedReport.breakdown}
                    total={themedReport.total.totalEmissions}
                    title={themedReport.breakdownTitle}
                    unit={themedReport.unit}
                  />
                  <TopCategories
                    categories={themedReport.topCategories}
                    title={themedReport.topTitle}
                    emptyText={themedReport.topEmptyText}
                    unit={themedReport.unit}
                  />
                </div>
                <SiteEmissionsTable
                  entities={report.entities}
                  columns={report.entityColumns}
                  entityLabel={report.entityLabel}
                  noun={report.entityNoun}
                  title={tableTitle}
                  unit={report.unit}
                  showFunctionalUnit={report.showFunctionalUnit}
                />
                <Card className="min-w-0 overflow-hidden">
                  <CardHeader>
                    <CardTitle>HTML report preview</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Source of truth for the PDF export. Click any title or paragraph to
                      edit it inline.
                    </p>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <div className="max-h-[820px] overflow-auto bg-secondary p-3 sm:p-4">
                      <style>{HTML_REPORT_STYLES}</style>
                      <HtmlReport
                        report={themedReport}
                        sections={sections}
                        settings={settings}
                        editable
                        onUpdateSection={handleUpdateSection}
                      />
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
                className="flex h-full min-h-[clamp(220px,32vh,440px)] items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/30 p-8 text-center"
              >
                <div>
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Leaf aria-hidden="true" className="h-7 w-7" />
                  </span>
                  <h2 className="mt-5 text-xl font-semibold text-foreground">
                    No report loaded
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                    Upload an OCF or PCF CSV (or load a sample) to preview totals,
                    breakdowns, per-entity emissions and category hotspots.
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
