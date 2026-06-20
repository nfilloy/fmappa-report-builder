"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, FileText, Settings2, UploadCloud } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileUpload } from "@/components/report-builder/FileUpload";
import { ReportSettingsPanel } from "@/components/report-builder/ReportSettingsPanel";
import {
  SectionEditor,
  SectionList,
} from "@/components/report-builder/SectionControls";
import { cn } from "@/lib/utils";

import { DatasetSummary } from "./DatasetSummary";

const TABS = [
  {
    id: "data",
    label: "Data",
    description: "Load or replace the CSV source.",
    icon: UploadCloud,
  },
  {
    id: "sections",
    label: "Sections",
    description: "Choose sections, edit copy and reorder.",
    icon: FileText,
  },
  {
    id: "branding",
    label: "Branding",
    description: "Metadata, branding and cover details.",
    icon: Settings2,
  },
];

export function WorkflowPanel({
  enabledSectionCount,
  kpis,
  onAddSection,
  onApplyPreset,
  onDuplicateSection,
  onFileSelected,
  onLoadSampleOcf,
  onLoadSamplePcf,
  onMoveSection,
  onRemoveSection,
  onReorderSections,
  onRestoreSections,
  onSelectSection,
  onToggleSection,
  onUpdateSection,
  presets,
  report,
  sections,
  selectedSectionId,
  settings,
  setSettings,
}) {
  // A single active workspace at a time — a vertical icon rail switches between
  // them (not a step wizard: any order, no next/back). One panel visible keeps
  // the column at a stable height with its own bounded scroll, so the page
  // itself never grows a long scrollbar.
  const [active, setActive] = useState("sections");

  // Before any CSV is loaded the panel is just the upload affordance.
  if (!report) {
    return (
      <Card className="sticky top-20 min-w-0 overflow-hidden">
        <div className="p-4">
          <FileUpload
            onFileSelected={onFileSelected}
            onLoadSampleOcf={onLoadSampleOcf}
            onLoadSamplePcf={onLoadSamplePcf}
            fileName={report?.fileName}
            fill
          />
        </div>
      </Card>
    );
  }

  const activeTab = TABS.find((tab) => tab.id === active) ?? TABS[0];

  return (
    <Card className="sticky top-20 flex min-w-0 overflow-hidden">
      {/* Icon rail */}
      <div className="flex shrink-0 flex-col items-center gap-1.5 border-r border-border/60 bg-secondary/40 p-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;
          const complete = tab.id === "data" && Boolean(report?.fileName);

          return (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <button
                  aria-label={tab.label}
                  aria-pressed={isActive}
                  className={cn(
                    "relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "mappa-gradient-1 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                  onClick={() => setActive(tab.id)}
                  type="button"
                >
                  <Icon aria-hidden="true" className="h-5 w-5" />
                  {complete ? (
                    <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-secondary">
                      <Check aria-hidden="true" className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                  ) : null}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{tab.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Active panel */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{activeTab.label}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {activeTab.description}
            </p>
          </div>
          {active === "sections" ? (
            <span className="shrink-0 rounded-full border border-border bg-secondary/80 px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
              {enabledSectionCount}/{sections.length} in PDF
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 overflow-y-auto p-4 [scrollbar-gutter:stable] max-h-[calc(100dvh-9rem)]">
          <AnimatePresence mode="wait">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              initial={{ opacity: 0, y: 6 }}
              key={active}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              {active === "data" ? (
                <div className="space-y-4">
                  <FileUpload
                    onFileSelected={onFileSelected}
                    onLoadSampleOcf={onLoadSampleOcf}
                    onLoadSamplePcf={onLoadSamplePcf}
                    fileName={report?.fileName}
                    compact
                  />
                  <DatasetSummary report={report} kpis={kpis} />
                </div>
              ) : null}

              {active === "sections" ? (
                <div className="space-y-4">
                  <SectionList
                    onAddSection={onAddSection}
                    onApplyPreset={onApplyPreset}
                    onReorderSections={onReorderSections}
                    onRestoreSections={onRestoreSections}
                    onSelectSection={onSelectSection}
                    presets={presets}
                    sections={sections}
                    selectedSectionId={selectedSectionId}
                  />
                  <SectionEditor
                    onDuplicateSection={onDuplicateSection}
                    onMoveSection={onMoveSection}
                    onRemoveSection={onRemoveSection}
                    onToggleSection={onToggleSection}
                    onUpdateSection={onUpdateSection}
                    sections={sections}
                    selectedSectionId={selectedSectionId}
                  />
                </div>
              ) : null}

              {active === "branding" ? (
                <ReportSettingsPanel
                  framed={false}
                  onChange={setSettings}
                  settings={settings}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}
