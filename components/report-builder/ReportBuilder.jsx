"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Download,
  FileText,
  Leaf,
  Loader2,
  Maximize2,
  UploadCloud,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { Tabs } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typewriter } from "@/components/ui/typewriter-text";
import { KpiCards } from "@/components/report-builder/KpiCards";
import { ScopeDonut } from "@/components/report-builder/charts/ScopeDonut";
import { SiteEmissionsTable } from "@/components/report-builder/SiteEmissionsTable";
import { TopCategories } from "@/components/report-builder/TopCategories";
import { AppHeader } from "@/components/report-builder/workflow/AppHeader";
import { WorkflowPanel } from "@/components/report-builder/workflow/WorkflowPanel";
import { HtmlReport } from "@/components/report-html/HtmlReport";
import { buildReport } from "@/lib/data/detectReportType";
import { DEFAULT_PCF_BOUNDARY } from "@/lib/data/pcf";
import { parseCsv } from "@/lib/data/parseCsv";
import { formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/report/chartTheme";
import { buildBrandTheme, RELATS_RED } from "@/lib/report/brandTheme";
import {
  HTML_REPORT_PREVIEW_STYLES,
  HTML_REPORT_STYLES,
} from "@/lib/report/htmlReportStyles";
import {
  applyPreset,
  buildReportSections,
  createCustomSection,
  getSectionPresets,
  removeSection,
  reorderSection,
  updateSection,
} from "@/lib/report/sections";

const SAMPLE_FILES = {
  ocf: "/sample_ocf_iso_14064.csv",
  pcf: "/sample_pcf_iso_14067.csv",
};

const VIEW_TABS = [
  { label: "Document", value: "document" },
  { label: "Summary", value: "summary" },
];

const HOW_IT_WORKS = [
  { icon: UploadCloud, title: "Upload your CSV", hint: "OCF or PCF dataset" },
  { icon: FileText, title: "Configure sections", hint: "Edit copy & reorder" },
  { icon: Download, title: "Export the PDF", hint: "Client-ready report" },
];

const A4_PAGE_WIDTH_PX = 794;
const A4_PAGE_HEIGHT_PX = 1123;

function buildKpis(report, accent) {
  if (!report) {
    return [];
  }

  const breakdownForKpis =
    report.kind === "pcf"
      ? [...report.breakdown].sort((a, b) => b.value - a.value).slice(0, 3)
      : report.breakdown;

  return [
    {
      label: report.totalMetricLabel || "Total emissions",
      value: report.total.totalEmissions,
      detail: report.totalSourceLabel,
      color: accent || BRAND.navy,
    },
    ...breakdownForKpis.map((item) => ({
      label: item.label,
      value: item.value,
      detail: formatPercent(item.percentage),
      color: item.color,
    })),
  ];
}

const INITIAL_SETTINGS = {
  clientName: "RELATS S.A.U.",
  reportLabel: "Organisational Carbon Footprint Report 2024",
  // The report is client-branded for Relats: default the accent to Relats'
  // corporate red. Uploading a client logo re-derives the accent from it.
  accentColor: RELATS_RED,
  accentSource: "brand",
  reportYear: "2024",
  preparedBy: "Footprint Mappa",
  preparedFor: "",
  reportDate: "",
  subtitle: "",
  totalSourceLabel: "",
  reportingPeriod: "",
  notes: "",
  logoDataUrl: "",
};

export function ReportBuilder() {
  const [report, setReport] = useState(null);
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  // Parsed CSV is retained so a boundary change can recompute the PCF model
  // (total, percentages, breakdown, hotspots, exclusions) without re-uploading.
  const [dataset, setDataset] = useState(null);
  // PCF system boundary. OCF ignores it; the selector is PCF-only.
  const [boundary, setBoundary] = useState(DEFAULT_PCF_BOUNDARY);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [view, setView] = useState("document");
  const [previewWidth, setPreviewWidth] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  // After an explicit section selection we programmatically smooth-scroll the
  // preview. The scroll-spy must not clobber that selection mid-animation, so
  // we mute it until this timestamp.
  const spyMutedUntil = useRef(0);
  // The scrollable preview viewport, stored in state via a callback ref so the
  // scroll-spy effect re-runs once the element actually mounts: it lives behind an
  // AnimatePresence transition and is not present on the first commit, so a plain
  // ref would still be null when the effect first runs.
  const [previewEl, setPreviewEl] = useState(null);

  const ingestCsv = useCallback((text, fileName) => {
    const rows = parseCsv(text);
    // A fresh dataset starts from the default boundary.
    const nextBoundary = DEFAULT_PCF_BOUNDARY;
    const nextReport = buildReport(rows, fileName, { boundary: nextBoundary });
    const nextSections = buildReportSections(nextReport);
    setDataset({ rows, fileName });
    setBoundary(nextBoundary);
    setReport(nextReport);
    setSections(nextSections);
    setSelectedSectionId(nextSections[0]?.id || "");
    setView("document");
    setSettings((currentSettings) => ({
      ...currentSettings,
      clientName: nextReport.clientName,
      reportLabel: nextReport.reportTitle,
    }));
  }, []);

  const resetReportState = useCallback(() => {
    setReport(null);
    setSections([]);
    setSelectedSectionId("");
    setDataset(null);
    setBoundary(DEFAULT_PCF_BOUNDARY);
    setView("document");
  }, []);

  // Changing the PCF boundary recomputes the model and regenerates the section
  // copy (auto copy is not preserved across a boundary change — see README).
  const handleBoundaryChange = useCallback(
    (nextBoundary) => {
      if (!dataset || nextBoundary === boundary) {
        return;
      }

      const nextReport = buildReport(dataset.rows, dataset.fileName, {
        boundary: nextBoundary,
      });
      const nextSections = buildReportSections(nextReport);
      setBoundary(nextBoundary);
      setReport(nextReport);
      setSections(nextSections);
      setSelectedSectionId(nextSections[0]?.id || "");
    },
    [dataset, boundary],
  );

  // Clicking the brand logo returns the app to its pristine landing state
  // (soft reset, no page reload). The theme lives outside React state, so it is
  // preserved automatically.
  const handleGoHome = useCallback(() => {
    resetReportState();
    setSettings(INITIAL_SETTINGS);
    setZoom(1);
    setPdfLoading(false);
    setLoading(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [resetReportState]);

  const handleFileSelected = useCallback(async (file) => {
    resetReportState();

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file.");
      return;
    }

    setLoading(true);

    try {
      const text = await file.text();
      ingestCsv(text, file.name);
    } catch (nextError) {
      toast.error("The CSV could not be parsed.", {
        description: nextError.message,
      });
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
      toast.error("The sample CSV could not be loaded.", {
        description: nextError.message,
      });
    } finally {
      setLoading(false);
    }
  }, [ingestCsv, resetReportState]);

  const handleLoadSampleOcf = useCallback(() => handleLoadSample("ocf"), [handleLoadSample]);
  const handleLoadSamplePcf = useCallback(() => handleLoadSample("pcf"), [handleLoadSample]);

  const brand = useMemo(() => buildBrandTheme(settings), [settings]);
  const kpis = useMemo(
    () => buildKpis(report, brand.accent),
    [report, brand.accent],
  );

  const handleDownloadPdf = useCallback(async () => {
    if (!report) {
      return;
    }

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
      const fileName = `${report.kind}-report-${settings.reportYear || "2024"}.pdf`;
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.rel = "noopener";
      // The anchor must be in the DOM for the download to fire in Firefox, and
      // the object URL must stay alive until the download has actually started,
      // so we revoke it on a short delay instead of synchronously.
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (nextError) {
      toast.error("The PDF could not be generated.", {
        description: nextError.message,
      });
    } finally {
      setPdfLoading(false);
    }
  }, [report, sections, settings]);

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
      setView("document");
      return [...currentSections, newSection];
    });
  }, []);

  const handleDuplicateSection = useCallback((sectionId) => {
    setSections((currentSections) => {
      const source = currentSections.find((section) => section.id === sectionId);

      if (!source) {
        return currentSections;
      }

      const duplicate = {
        ...source,
        id: `custom-${Date.now()}`,
        title: `${source.title} copy`,
        removable: true,
      };
      const sourceIndex = currentSections.findIndex(
        (section) => section.id === sectionId,
      );
      const nextSections = [...currentSections];
      nextSections.splice(sourceIndex + 1, 0, duplicate);
      setSelectedSectionId(duplicate.id);
      return nextSections;
    });
  }, []);

  const handleMoveSection = useCallback((sectionId, direction) => {
    setSections((currentSections) =>
      reorderSection(currentSections, sectionId, direction),
    );
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

  const scrollPreviewToSection = useCallback(
    (sectionId) => {
      if (!previewEl) {
        return;
      }

      const target = previewEl.querySelector(`[data-section-id="${sectionId}"]`);
      if (!target) {
        return;
      }

      const top =
        target.getBoundingClientRect().top -
        previewEl.getBoundingClientRect().top +
        previewEl.scrollTop -
        12;
      spyMutedUntil.current = Date.now() + 900;
      previewEl.scrollTo({ top, behavior: "smooth" });
    },
    [previewEl],
  );

  const handleSelectSection = useCallback(
    (sectionId) => {
      setSelectedSectionId(sectionId);
      setView("document");
      scrollPreviewToSection(sectionId);
    },
    [scrollPreviewToSection],
  );

  const handlePreviewSectionSelect = useCallback((sectionId) => {
    setSelectedSectionId(sectionId);
  }, []);

  const zoomOut = useCallback(
    () => setZoom((value) => Math.max(0.5, Math.round((value - 0.1) * 10) / 10)),
    [],
  );
  const zoomIn = useCallback(
    () => setZoom((value) => Math.min(1.5, Math.round((value + 0.1) * 10) / 10)),
    [],
  );
  const zoomReset = useCallback(() => setZoom(1), []);

  // Scroll-spy: highlight the section currently at the top of the preview so the
  // controls list stays in sync as the user scrolls the report.
  useEffect(() => {
    const container = previewEl;
    if (!container) {
      return undefined;
    }

    let frame = 0;
    const handleScroll = () => {
      if (frame) {
        return;
      }
      frame = requestAnimationFrame(() => {
        frame = 0;
        // Don't override an explicit selection while its smooth-scroll runs.
        if (Date.now() < spyMutedUntil.current) {
          return;
        }
        const containerTop = container.getBoundingClientRect().top;
        let current = "";
        container.querySelectorAll("[data-section-id]").forEach((element) => {
          if (element.getBoundingClientRect().top - containerTop <= 90) {
            current = element.getAttribute("data-section-id");
          }
        });
        if (current) {
          setSelectedSectionId((previous) =>
            previous === current ? previous : current,
          );
        }
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [previewEl]);

  useEffect(() => {
    const container = previewEl;
    if (!container) {
      return undefined;
    }

    const updatePreviewMetrics = () => {
      setPreviewWidth(container.clientWidth);

      const page = container.querySelector(".report-page");
      if (page) {
        setPageCount(
          Math.max(1, Math.ceil(page.scrollHeight / A4_PAGE_HEIGHT_PX)),
        );
      }
    };

    updatePreviewMetrics();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updatePreviewMetrics);
      return () => window.removeEventListener("resize", updatePreviewMetrics);
    }

    const observer = new ResizeObserver(updatePreviewMetrics);
    observer.observe(container);

    const page = container.querySelector(".report-page");
    if (page) {
      observer.observe(page);
    }

    return () => observer.disconnect();
  }, [previewEl, report, sections, settings, view]);

  const effectiveZoom = useMemo(() => {
    if (!previewWidth) {
      return zoom;
    }

    const fitScale = (previewWidth - 32) / A4_PAGE_WIDTH_PX;
    if (fitScale <= 0 || fitScale >= 1) {
      return zoom;
    }

    return Math.min(zoom, Math.max(0.32, fitScale));
  }, [previewWidth, zoom]);

  const tableTitle = report?.kind === "pcf" ? "Product emissions" : "Site emissions";
  const enabledSectionCount = useMemo(
    () => sections.filter((section) => section.enabled).length,
    [sections],
  );
  const sectionPresets = useMemo(
    () => (report ? getSectionPresets(report.kind) : {}),
    [report],
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Toaster />
      <main className="app-dune-bg min-h-screen overflow-x-clip text-foreground">
      <AppHeader
        enabledCount={enabledSectionCount}
        onDownload={handleDownloadPdf}
        onHome={handleGoHome}
        pdfLoading={pdfLoading}
        report={report}
        settings={settings}
        totalSections={sections.length}
      />
      <section
        className={cn(
          "mx-auto w-full max-w-6xl px-4 sm:px-8",
          report
            ? "py-8"
            : "flex min-h-dvh flex-col py-[clamp(1rem,2.5vh,2rem)]",
        )}
      >
        {!report ? (
          <div className="mappa-hero-gradient flex min-w-0 flex-col gap-[clamp(1rem,2.6vh,2rem)] px-1 py-[clamp(0.5rem,1.5vh,1.5rem)] sm:px-2">
            <motion.div
              className="min-w-0 max-w-xl"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
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
            </motion.div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-3">
              {HOW_IT_WORKS.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    className="mappa-lift flex min-w-0 items-center gap-3 rounded-xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.12 + index * 0.08,
                    }}
                  >
                    <span className="mappa-gradient-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm">
                      <StepIcon aria-hidden="true" className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                        Step {index + 1}
                      </p>
                      <p className="truncate text-sm font-medium text-foreground">
                        {step.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {step.hint}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : null}

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
            <WorkflowPanel
              boundary={boundary}
              enabledSectionCount={enabledSectionCount}
              kpis={kpis}
              onAddSection={handleAddSection}
              onApplyPreset={handleApplyPreset}
              onBoundaryChange={handleBoundaryChange}
              onDuplicateSection={handleDuplicateSection}
              onFileSelected={handleFileSelected}
              onLoadSampleOcf={handleLoadSampleOcf}
              onLoadSamplePcf={handleLoadSamplePcf}
              onMoveSection={handleMoveSection}
              onRemoveSection={handleRemoveSection}
              onReorderSections={handleReorderSections}
              onRestoreSections={handleRestoreSections}
              onSelectSection={handleSelectSection}
              onToggleSection={handleToggleSection}
              onUpdateSection={handleUpdateSection}
              presets={sectionPresets}
              report={report}
              sections={sections}
              selectedSectionId={selectedSectionId}
              settings={settings}
              setSettings={setSettings}
            />
            {loading ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                Parsing CSV
              </div>
            ) : null}
          </aside>

          <AnimatePresence mode="wait">
            {report ? (
              <motion.div
                key="report"
                className="min-w-0"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <Card className="min-w-0 overflow-hidden">
                  <CardHeader className="gap-4 border-b border-border/70 bg-card/95 pb-4">
                    <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                        <Tabs
                          aria-label="Report canvas view"
                          className="w-full sm:w-auto"
                          items={VIEW_TABS}
                          onValueChange={setView}
                          value={view}
                        />
                        <div className="min-w-0">
                          <CardTitle>
                            {view === "document"
                              ? "HTML report preview"
                              : "Report summary"}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {view === "document"
                              ? `A4 screen preview · ${pageCount} page${pageCount === 1 ? "" : "s"}`
                              : tableTitle}
                          </p>
                        </div>
                      </div>
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        {view === "document" ? (
                          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-card p-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  aria-label="Zoom out"
                                  disabled={zoom <= 0.5}
                                  onClick={zoomOut}
                                  size="icon"
                                  type="button"
                                  variant="ghost"
                                >
                                  <ZoomOut aria-hidden="true" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Zoom out</TooltipContent>
                            </Tooltip>
                            <span className="w-10 text-center text-xs font-medium tabular-nums text-muted-foreground">
                              {Math.round(effectiveZoom * 100)}%
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  aria-label="Zoom in"
                                  disabled={zoom >= 1.5}
                                  onClick={zoomIn}
                                  size="icon"
                                  type="button"
                                  variant="ghost"
                                >
                                  <ZoomIn aria-hidden="true" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Zoom in</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  aria-label="Reset zoom"
                                  disabled={zoom === 1}
                                  onClick={zoomReset}
                                  size="icon"
                                  type="button"
                                  variant="ghost"
                                >
                                  <Maximize2 aria-hidden="true" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reset zoom</TooltipContent>
                            </Tooltip>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </CardHeader>

                  {view === "summary" ? (
                    <CardContent className="bg-secondary/30 p-4 sm:p-5">
                      <div className="min-w-0 space-y-6">
                        <KpiCards kpis={kpis} unit={report.unit} />
                        <div className="grid min-w-0 items-start gap-6 xl:grid-cols-2">
                          <ScopeDonut
                            breakdown={report.breakdown}
                            total={report.total.totalEmissions}
                            title={report.breakdownTitle}
                            unit={report.unit}
                          />
                          <TopCategories
                            categories={report.topCategories}
                            title={report.topTitle}
                            emptyText={report.topEmptyText}
                            unit={report.unit}
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
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent className="p-0">
                      <div
                        ref={setPreviewEl}
                        className="report-preview-viewport max-h-[calc(100dvh-12rem)] min-h-[520px] overflow-auto p-4 sm:p-6"
                      >
                        <style>{HTML_REPORT_STYLES}</style>
                        <style>{HTML_REPORT_PREVIEW_STYLES}</style>
                        <div
                          className="report-preview-zoom"
                          style={{ zoom: effectiveZoom }}
                        >
                          <div className="report-preview-a4">
                            <HtmlReport
                              report={report}
                              sections={sections}
                              settings={settings}
                              editable
                              onSelectSection={handlePreviewSectionSelect}
                              onUpdateSection={handleUpdateSection}
                              selectedSectionId={selectedSectionId}
                            />
                            {Array.from({ length: pageCount }, (_, index) => (
                              <div
                                aria-hidden="true"
                                className="report-preview-page-chrome"
                                key={index}
                                style={{ "--page-index": index }}
                              >
                                <div className="report-preview-page-header">
                                  <span className="report-preview-page-brand">
                                    <strong>{settings.clientName || report.clientName}</strong>
                                  </span>
                                  <span className="report-preview-page-title">
                                    {settings.reportLabel || report.reportTitle} |{" "}
                                    {settings.reportYear || "2024"}
                                  </span>
                                </div>
                                <div className="report-preview-page-footer">
                                  <span>
                                    Prepared by{" "}
                                    <strong>
                                      {settings.preparedBy || "Footprint Mappa"}
                                    </strong>
                                  </span>
                                  <span>
                                    Page {index + 1} of {pageCount}
                                  </span>
                                </div>
                                <span className="report-preview-page-label">
                                  Page {index + 1}
                                </span>
                                {index + 1 < pageCount ? (
                                  <span className="report-preview-page-break" />
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
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
    </TooltipProvider>
  );
}
