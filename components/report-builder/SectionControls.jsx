"use client";

import { memo, useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SectionActionButtons } from "@/components/report-builder/workflow/SectionActionButtons";
import { cn } from "@/lib/utils";

const TYPE_LABELS = {
  "category-tables": "Data tables",
  chart: "Chart",
  insights: "Insights",
  metrics: "Metrics",
  "narrative-analysis": "Narrative",
  recommendations: "Recommendations",
  table: "Table",
  text: "Text",
};

function sectionTypeLabel(section) {
  if (section.removable) {
    return "Custom";
  }

  return TYPE_LABELS[section.type] || section.type;
}

const TileInner = memo(function TileInner({ section, index, isSelected, dragging, onSelectSection }) {
  return (
    <div
      className={`group mappa-lift flex min-w-0 items-center gap-2 rounded-lg border p-2.5 ${
        isSelected
          ? "border-primary bg-primary/5 shadow-[0_0_0_1px_var(--primary)]"
          : "border-border bg-card hover:border-primary/40 hover:bg-secondary/40"
      } ${section.enabled ? "" : "opacity-60"} ${dragging ? "shadow-[0_16px_32px_-12px_rgba(20,22,31,0.45)]" : ""}`}
    >
      <span
        aria-hidden="true"
        className="shrink-0 cursor-grab text-muted-foreground"
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </span>
      <button
        className="min-w-0 flex-1 text-left"
        onClick={() => onSelectSection(section.id)}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="w-6 shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="block min-w-0 truncate text-sm font-medium" title={section.title}>
            {section.title}
          </span>
        </span>
        <span className="mt-1 block truncate pl-8 text-xs text-muted-foreground">
          {section.enabled ? "Included" : "Hidden"} · {sectionTypeLabel(section)}
        </span>
      </button>
      <span
        aria-hidden="true"
        className={`shrink-0 ${section.enabled ? "text-primary" : "text-muted-foreground"}`}
        title={section.enabled ? "Included in PDF" : "Hidden from PDF"}
      >
        {section.enabled ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </span>
    </div>
  );
});

const SortableSectionTile = memo(function SortableSectionTile(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`cursor-grab touch-none rounded-xl outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-ring ${
        isDragging
          ? "rounded-xl border border-dashed border-primary/50 bg-primary/5 opacity-40"
          : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <div className={isDragging ? "invisible" : ""}>
        <TileInner {...props} dragging={false} />
      </div>
    </div>
  );
});

export const SectionList = memo(function SectionList({
  sections,
  onReorderSections,
  onRestoreSections,
  onSelectSection,
  onAddSection,
  onApplyPreset,
  presets = {},
  selectedSectionId,
}) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sectionIds = useMemo(
    () => sections.map((section) => section.id),
    [sections],
  );
  const enabledCount = useMemo(
    () => sections.filter((section) => section.enabled).length,
    [sections],
  );
  const selectedSection = useMemo(
    () =>
      sections.find((section) => section.id === selectedSectionId) || sections[0],
    [sections, selectedSectionId],
  );
  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeId),
    [activeId, sections],
  );

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sections.findIndex((section) => section.id === active.id);
    const newIndex = sections.findIndex((section) => section.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onReorderSections(arrayMove(sections, oldIndex, newIndex));
  }, [onReorderSections, sections]);

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Document outline
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {enabledCount} of {sections.length} included in PDF
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Restore default sections"
              onClick={onRestoreSections}
              size="icon"
              type="button"
              variant="ghost"
            >
              <RotateCcw aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Restore default sections</TooltipContent>
        </Tooltip>
      </div>

      <details className="group min-w-0 rounded-lg border border-border bg-secondary/30 p-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-foreground">
          Templates
          <ChevronDown
            aria-hidden="true"
            className="h-4 w-4 text-muted-foreground transition group-open:rotate-180"
          />
        </summary>
        <div className="mt-3 flex min-w-0 flex-wrap gap-2">
          {Object.entries(presets).map(([presetId, preset]) => (
            <Button
              key={presetId}
              onClick={() => onApplyPreset(presetId)}
              size="sm"
              type="button"
              variant="outline"
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </details>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragStart={(event) => setActiveId(event.active.id)}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sectionIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="max-h-[34dvh] min-h-[220px] space-y-2 overflow-auto pr-1">
            {sections.map((section, index) => (
              <SortableSectionTile
                key={section.id}
                index={index}
                isSelected={section.id === selectedSection?.id}
                onSelectSection={onSelectSection}
                section={section}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeSection ? (
            <div className="rotate-[-1.5deg] scale-[1.03] cursor-grabbing">
              <TileInner
                dragging
                isSelected={activeSection.id === selectedSection?.id}
                onSelectSection={() => {}}
                section={activeSection}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Button
        className="w-full"
        onClick={onAddSection}
        type="button"
        variant="outline"
      >
        <Plus aria-hidden="true" />
        Add section
      </Button>
    </div>
  );
});

export const SectionEditor = memo(function SectionEditor({
  className,
  sections,
  selectedSectionId,
  onUpdateSection,
  onDuplicateSection,
  onMoveSection,
  onRemoveSection,
  onToggleSection,
}) {
  const selectedSection = useMemo(
    () =>
      sections.find((section) => section.id === selectedSectionId) || sections[0],
    [sections, selectedSectionId],
  );

  if (!selectedSection) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-border bg-secondary/30 p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        Select a section in the document to edit its copy.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="min-w-0 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Edit selected section
          </h2>
          <p className="mt-1 truncate text-base font-semibold text-foreground">
            {selectedSection.title}
          </p>
        </div>
        <Badge variant="outline">
          {sectionTypeLabel(selectedSection)}
        </Badge>
      </div>
      <div className="mt-4">
        <SectionActionButtons
          onDuplicate={onDuplicateSection}
          onMove={onMoveSection}
          onRemove={onRemoveSection}
          onToggle={onToggleSection}
          section={selectedSection}
        />
      </div>
      <label className="mt-5 block text-sm font-medium text-foreground">
        Title
        <Input
          className="mt-2"
          onChange={(event) =>
            onUpdateSection(selectedSection.id, { title: event.target.value })
          }
          value={selectedSection.title}
        />
      </label>
      <label className="mt-5 block text-sm font-medium text-foreground">
        Section copy
        <Textarea
          className="mt-2 min-h-56 resize-y"
          onChange={(event) =>
            onUpdateSection(selectedSection.id, {
              content: event.target.value,
            })
          }
          value={selectedSection.content}
        />
      </label>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        Changes update the document preview immediately. For data sections, this
        copy appears above the generated table or chart.
      </p>
    </div>
  );
});

export const SectionControls = memo(function SectionControls(props) {
  return (
    <Card className="min-w-0">
      <CardContent className="min-w-0 space-y-4">
        <SectionList {...props} />
        <SectionEditor
          onDuplicateSection={props.onDuplicateSection}
          onMoveSection={props.onMoveSection}
          onRemoveSection={props.onRemoveSection}
          onToggleSection={props.onToggleSection}
          onUpdateSection={props.onUpdateSection}
          sections={props.sections}
          selectedSectionId={props.selectedSectionId}
        />
      </CardContent>
    </Card>
  );
});
