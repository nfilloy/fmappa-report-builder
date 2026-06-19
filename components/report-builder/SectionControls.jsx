"use client";

import { useState } from "react";
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
import { GripVertical, Plus, RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SECTION_PRESETS } from "@/lib/report/sections";

function TileInner({ section, isSelected, dragging, onToggleSection, onSelectSection, onRemoveSection }) {
  return (
    <div
      className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 transition-all ${
        isSelected
          ? "border-primary bg-primary/5 shadow-[0_0_0_1px_var(--primary)]"
          : "border-border bg-card hover:border-primary/40 hover:bg-secondary/40"
      } ${dragging ? "shadow-[0_16px_32px_-12px_rgba(20,22,31,0.45)]" : ""}`}
    >
      <span
        aria-hidden="true"
        className="shrink-0 text-muted-foreground"
        title="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </span>
      <label
        className="flex min-w-0 flex-1 items-center gap-3 text-sm text-foreground"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <input
          checked={section.enabled}
          className="h-4 w-4 accent-[var(--primary)]"
          onChange={() => onToggleSection(section.id)}
          type="checkbox"
        />
        <button
          className="min-w-0 flex-1 text-left"
          onClick={() => onSelectSection(section.id)}
          type="button"
        >
          <span className="block truncate font-medium" title={section.title}>
            {section.title}
          </span>
          <span className="mt-1 block truncate text-xs uppercase tracking-wide text-muted-foreground">
            {section.removable ? "custom · text" : section.type}
          </span>
        </button>
      </label>
      {section.removable ? (
        <span onPointerDown={(event) => event.stopPropagation()}>
          <Button
            aria-label={`Remove ${section.title}`}
            onClick={() => onRemoveSection(section.id)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </span>
      ) : null}
    </div>
  );
}

function SortableSectionTile(props) {
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
}

export function SectionControls({
  sections,
  onToggleSection,
  onReorderSections,
  onRestoreSections,
  onSelectSection,
  onUpdateSection,
  onAddSection,
  onRemoveSection,
  onApplyPreset,
  selectedSectionId,
}) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const enabledCount = sections.filter((section) => section.enabled).length;
  const selectedSection =
    sections.find((section) => section.id === selectedSectionId) || sections[0];
  const activeSection = sections.find((section) => section.id === activeId);

  function handleDragEnd(event) {
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
  }

  return (
    <Card className="min-w-0">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>Template sections</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {enabledCount} of {sections.length} included in PDF
          </p>
        </div>
        <Button
          aria-label="Restore default sections"
          onClick={onRestoreSections}
          size="icon"
          type="button"
          variant="ghost"
        >
          <RotateCcw aria-hidden="true" />
        </Button>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Templates
          </p>
          <div className="mt-2 flex min-w-0 flex-wrap gap-2">
            {Object.entries(SECTION_PRESETS).map(([presetId, preset]) => (
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
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragStart={(event) => setActiveId(event.active.id)}
          onDragCancel={() => setActiveId(null)}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((section) => section.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sections.map((section) => (
                <SortableSectionTile
                  key={section.id}
                  isSelected={section.id === selectedSection?.id}
                  onRemoveSection={onRemoveSection}
                  onSelectSection={onSelectSection}
                  onToggleSection={onToggleSection}
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
                  onRemoveSection={() => {}}
                  onSelectSection={() => {}}
                  onToggleSection={() => {}}
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

        {selectedSection ? (
          <div className="rounded-xl border border-border bg-secondary/40 p-4">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <h3 className="min-w-0 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Edit section
              </h3>
              <Badge variant="outline">
                {selectedSection.removable ? "custom" : selectedSection.type}
              </Badge>
            </div>
            <label className="mt-4 block text-sm font-medium text-foreground">
              Title
              <Input
                className="mt-2"
                onChange={(event) =>
                  onUpdateSection(selectedSection.id, { title: event.target.value })
                }
                value={selectedSection.title}
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-foreground">
              Section copy
              <Textarea
                className="mt-2"
                onChange={(event) =>
                  onUpdateSection(selectedSection.id, {
                    content: event.target.value,
                  })
                }
                value={selectedSection.content}
              />
            </label>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              For data sections, this copy appears above the generated table or chart.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
