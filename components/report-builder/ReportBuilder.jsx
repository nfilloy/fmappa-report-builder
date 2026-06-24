"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Download,
  Expand,
  FileText,
  Loader2,
  Maximize2,
  Shrink,
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
import { ReportDownloadButton } from "@/components/report-builder/ReportDownloadButton";
import { ScopeDonut } from "@/components/report-builder/charts/ScopeDonut";
import { SiteEmissionsTable } from "@/components/report-builder/SiteEmissionsTable";
import { TopCategories } from "@/components/report-builder/TopCategories";
import { AppHeader } from "@/components/report-builder/workflow/AppHeader";
import { WorkflowPanel } from "@/components/report-builder/workflow/WorkflowPanel";
import { ColumnMappingPanel } from "@/components/report-builder/ColumnMappingPanel";
import { HtmlReport } from "@/components/report-html/HtmlReport";
import { buildReport } from "@/lib/data/detectReportType";
import { DEFAULT_PCF_BOUNDARY } from "@/lib/data/pcf";
import { applyColumnMapping } from "@/lib/data/schema";
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
  buildReportTitle,
  createCustomSection,
  getSectionPresets,
  regenerateSectionContent,
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

// Validation failures that should trigger the column-mapping recovery flow
// (column-shaped problems), as opposed to a hard error like an empty CSV.
const COLUMN_ERROR_PATTERN = /Missing required columns|Unrecognised CSV format/i;

// Non-blocking summary of malformed-number warnings collected while building the
// report model (A2). Cites the first offender as an example.
function buildWarningMessage(warnings) {
  const [first] = warnings;
  const example = first ? ` (e.g. '${first.row}' → ${first.column})` : "";
  return `${warnings.length} value(s) couldn't be read and were treated as 0${example}.`;
}

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
  reportLabel: buildReportTitle("ocf", "2024"),
  // `reportLabel` is derived from kind + year unless the user edits it, at which
  // point this flag pins their custom label across year changes.
  reportLabelDirty: false,
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
  // Data sources shown in the methodology badges / prose. Empty until a CSV is
  // loaded, then defaulted to the report's per-kind sources (editable in the
  // branding panel).
  dataSources: [],
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
  // Set when an uploaded CSV fails validation on column issues, driving the
  // inline column-mapping recovery panel: { kind, csvColumns, rows, fileName }.
  const [mappingRequest, setMappingRequest] = useState(null);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [view, setView] = useState("document");
  // Full-screen workspace overlay: edit panel + live preview fill the viewport.
  const [expanded, setExpanded] = useState(false);
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
  // Always-current settings, so callbacks with stable identities (ingest,
  // boundary change, toggle, preset) can read the live client/year/data-sources
  // metadata without listing `settings` as a dependency.
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  // Same pattern for the report model, used by section-copy regeneration.
  const reportRef = useRef(report);
  useEffect(() => {
    reportRef.current = report;
  }, [report]);

  // While the full-screen workspace overlay is open, close it on Escape and
  // lock the page behind it from scrolling.
  useEffect(() => {
    if (!expanded) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setExpanded(false);
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  // Build a fresh section set whose generated copy reflects the current (or
  // overridden) client name, reporting year and data sources.
  const buildSectionsFor = useCallback((nextReport, overrides = {}) => {
    const current = settingsRef.current;
    return buildReportSections(nextReport, {
      clientName: overrides.clientName ?? current.clientName,
      reportYear: overrides.reportYear ?? current.reportYear,
      dataSources: overrides.dataSources ?? current.dataSources,
    });
  }, []);

  // Apply a successfully-built report model to the workspace. Shared by the
  // direct upload path and the post-mapping rebuild so warnings, sections and
  // settings all flow identically.
  const applyReport = useCallback(
    (nextReport, rows, fileName) => {
      // A fresh dataset starts from the default boundary.
      const nextBoundary = DEFAULT_PCF_BOUNDARY;
      const reportYear = settingsRef.current.reportYear;
      // New CSV resets the client name and data sources to this report's
      // defaults, but keeps the user's reporting year so copy and cover stay in
      // sync.
      const nextSections = buildSectionsFor(nextReport, {
        clientName: nextReport.clientName,
        dataSources: nextReport.dataSources,
      });
      setMappingRequest(null);
      setDataset({ rows, fileName });
      setBoundary(nextBoundary);
      setReport(nextReport);
      setSections(nextSections);
      setSelectedSectionId(nextSections[0]?.id || "");
      setView("document");
      setSettings((currentSettings) => ({
        ...currentSettings,
        clientName: nextReport.clientName,
        reportLabel: buildReportTitle(nextReport.kind, reportYear),
        reportLabelDirty: false,
        dataSources: nextReport.dataSources,
      }));

      // Surface malformed-number warnings non-blockingly (A2).
      if (nextReport.warnings?.length) {
        toast.warning(buildWarningMessage(nextReport.warnings));
      }
    },
    [buildSectionsFor],
  );

  const ingestCsv = useCallback(
    (text, fileName) => {
      const rows = parseCsv(text);
      if (!rows.length) {
        throw new Error("The CSV does not contain any data rows.");
      }

      let nextReport;
      try {
        nextReport = buildReport(rows, fileName, {
          boundary: DEFAULT_PCF_BOUNDARY,
        });
      } catch (error) {
        // Column-shaped failures open the mapping recovery panel; anything else
        // (e.g. an empty CSV) propagates to the caller's error toast.
        if (!COLUMN_ERROR_PATTERN.test(error.message)) {
          throw error;
        }
        // Don't guess the schema: open the panel with no kind so the user
        // explicitly picks OCF or PCF, then maps the columns.
        setMappingRequest({
          kind: null,
          csvColumns: Object.keys(rows[0]),
          rows,
          fileName,
        });
        return;
      }

      applyReport(nextReport, rows, fileName);
    },
    [applyReport],
  );

  // Rebuild the report after the user maps the CSV columns onto a known schema.
  // If it still fails to validate, keep the panel open and surface the reason.
  const handleConfirmMapping = useCallback(
    (mapping) => {
      const request = mappingRequest;
      if (!request) {
        return;
      }

      const remappedRows = applyColumnMapping(request.rows, mapping);
      try {
        const nextReport = buildReport(remappedRows, request.fileName, {
          boundary: DEFAULT_PCF_BOUNDARY,
        });
        applyReport(nextReport, remappedRows, request.fileName);
      } catch (error) {
        toast.error("The mapped columns still don't validate.", {
          description: error.message,
        });
      }
    },
    [mappingRequest, applyReport],
  );

  const handleCancelMapping = useCallback(() => {
    setMappingRequest(null);
  }, []);

  const resetReportState = useCallback(() => {
    setReport(null);
    setSections([]);
    setSelectedSectionId("");
    setDataset(null);
    setBoundary(DEFAULT_PCF_BOUNDARY);
    setMappingRequest(null);
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
      const nextSections = buildSectionsFor(nextReport);
      setBoundary(nextBoundary);
      setReport(nextReport);
      setSections(nextSections);
      setSelectedSectionId(nextSections[0]?.id || "");
    },
    [dataset, boundary, buildSectionsFor],
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

  // Regenerate the untouched (non-dirty) auto copy so cross-references stay
  // consistent with whichever sections are currently enabled.
  const regenerateForEnabled = useCallback((nextSections) => {
    const current = settingsRef.current;
    const enabledIds = new Set(
      nextSections.filter((section) => section.enabled).map((section) => section.id),
    );
    return regenerateSectionContent(nextSections, reportRef.current, {
      clientName: current.clientName,
      reportYear: current.reportYear,
      dataSources: current.dataSources,
      enabledIds,
    });
  }, []);

  const handleToggleSection = useCallback(
    (sectionId) => {
      setSections((currentSections) =>
        regenerateForEnabled(
          currentSections.map((section) =>
            section.id === sectionId
              ? { ...section, enabled: !section.enabled }
              : section,
          ),
        ),
      );
    },
    [regenerateForEnabled],
  );

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

  const handleApplyPreset = useCallback(
    (presetId) => {
      setSections((currentSections) =>
        regenerateForEnabled(
          applyPreset(currentSections, presetId, reportRef.current?.kind),
        ),
      );
    },
    [regenerateForEnabled],
  );

  const handleUpdateSection = useCallback((sectionId, updates) => {
    // A manual title/content edit pins the section so metadata or section-set
    // changes no longer overwrite it.
    const marksDirty = "content" in updates || "title" in updates;
    setSections((currentSections) =>
      updateSection(
        currentSections,
        sectionId,
        marksDirty ? { ...updates, dirty: true } : updates,
      ),
    );
  }, []);

  const handleRestoreSections = useCallback(() => {
    if (!report) {
      return;
    }

    // Restore discards manual edits and regenerates every section from the
    // current metadata.
    const restoredSections = buildSectionsFor(report);
    setSections(restoredSections);
    setSelectedSectionId(restoredSections[0]?.id || "");
  }, [report, buildSectionsFor]);

  // Wraps `setSettings`: keeps the derived report title in sync with the year
  // (until the user pins a custom label) and supports the functional updates the
  // colour picker uses. Section copy is regenerated by the effect below.
  const handleSettingsChange = useCallback((update) => {
    setSettings((prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      if (
        reportRef.current &&
        next.reportYear !== prev.reportYear &&
        !next.reportLabelDirty
      ) {
        return {
          ...next,
          reportLabel: buildReportTitle(reportRef.current.kind, next.reportYear),
        };
      }
      return next;
    });
  }, []);

  // Regenerate untouched section copy when the client name, reporting year or
  // data sources change, so the narrative tracks the form (the cover already
  // reads settings live). Manual edits (dirty sections) are preserved. A report
  // (re)load / boundary change resets the baseline without regenerating, since
  // those paths already build fresh sections.
  const metaBaselineRef = useRef({ report: null, key: "" });
  useEffect(() => {
    if (!report) {
      metaBaselineRef.current = { report: null, key: "" };
      return;
    }

    const key = [
      settings.clientName,
      settings.reportYear,
      (settings.dataSources || []).join(""),
    ].join(" ");
    const baseline = metaBaselineRef.current;

    if (baseline.report !== report) {
      metaBaselineRef.current = { report, key };
      return;
    }
    if (baseline.key === key) {
      return;
    }

    metaBaselineRef.current = { report, key };
    setSections((current) =>
      regenerateSectionContent(current, report, {
        clientName: settings.clientName,
        reportYear: settings.reportYear,
        dataSources: settings.dataSources,
        enabledIds: new Set(
          current
            .filter((section) => section.enabled)
            .map((section) => section.id),
        ),
      }),
    );
  }, [report, settings.clientName, settings.reportYear, settings.dataSources]);

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

  // Pristine landing: no report and no in-progress column mapping. Drives the
  // single centered upload layout (no empty placeholder, fits the viewport).
  const isLanding = !report && !mappingRequest;

  // The full-screen workspace only makes sense once a report exists, so gate the
  // overlay on that to avoid a stuck empty overlay if the report is cleared.
  const isExpanded = expanded && Boolean(report);

  return (
    <TooltipProvider delayDuration={200}>
      <Toaster />
      <main className="app-dune-bg min-h-dvh overflow-x-clip text-foreground">
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
          isExpanded
            ? "app-dune-surface fixed inset-0 z-50 w-full overflow-hidden px-4 py-4 sm:px-8"
            : cn(
                "mx-auto w-full max-w-6xl px-4 sm:px-8",
                isLanding ? "py-[clamp(1rem,2.5vh,2rem)]" : "py-8",
              ),
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
            "min-w-0",
            isLanding
              ? "mx-auto w-full max-w-xl"
              : isExpanded
                ? "grid h-[calc(100dvh-2rem)] grid-rows-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]"
                : "grid gap-6 py-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]",
          )}
        >
          <aside
            className={cn(
              "min-w-0 space-y-4",
              isExpanded && "min-h-0",
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
              setSettings={handleSettingsChange}
              fill={isExpanded}
            />
            {loading ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                Parsing CSV
              </div>
            ) : null}
          </aside>

          {!isLanding ? (
          <AnimatePresence mode="wait">
            {report ? (
              <motion.div
                key="report"
                  className={cn("min-w-0", isExpanded && "h-full min-h-0")}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <Card
                  className={cn(
                    "min-w-0 overflow-hidden",
                    isExpanded && "flex h-full flex-col",
                  )}
                >
                  <CardHeader
                    className={cn(
                      "gap-4 border-b border-border/70 bg-card/95 pb-4",
                      isExpanded && "shrink-0",
                    )}
                  >
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
                        {isExpanded ? (
                          <ReportDownloadButton
                            onDownload={handleDownloadPdf}
                            pdfLoading={pdfLoading}
                          />
                        ) : null}
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
                        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-card p-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                aria-label={
                                  expanded ? "Contraer vista" : "Expandir vista"
                                }
                                aria-pressed={expanded}
                                onClick={() => setExpanded((value) => !value)}
                                size="icon"
                                type="button"
                                variant="ghost"
                              >
                                {expanded ? (
                                  <Shrink aria-hidden="true" />
                                ) : (
                                  <Expand aria-hidden="true" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {expanded
                                ? "Contraer vista"
                                : "Expandir a pantalla completa"}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {view === "summary" ? (
                    <CardContent
                      className={cn(
                        "bg-secondary/30 p-4 sm:p-5",
                        isExpanded && "min-h-0 flex-1 overflow-auto",
                      )}
                    >
                      <div className="min-w-0 space-y-6">
                        <KpiCards kpis={kpis} unit={report.unit} />
                        <div className="grid min-w-0 items-start gap-6 xl:grid-cols-2">
                          <ScopeDonut
                            breakdown={report.breakdown}
                            expanded={isExpanded}
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
                    <CardContent
                      className={cn("p-0", isExpanded && "min-h-0 flex-1")}
                    >
                      <div
                        ref={setPreviewEl}
                        className={cn(
                          "report-preview-viewport min-h-[520px] overflow-auto p-4 sm:p-6",
                          isExpanded
                            ? "h-full max-h-none"
                            : "max-h-[calc(100dvh-12rem)]",
                        )}
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
            ) : mappingRequest ? (
              <motion.div
                key="mapping"
                className="min-w-0"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <ColumnMappingPanel
                  request={mappingRequest}
                  onConfirm={handleConfirmMapping}
                  onCancel={handleCancelMapping}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
          ) : null}
        </div>
      </section>
      </main>
    </TooltipProvider>
  );
}
