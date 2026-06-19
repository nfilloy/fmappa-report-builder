"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SectionControls({
  sections,
  onToggleSection,
  onMoveSection,
}) {
  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-white">Report sections</h2>
      </div>

      <div className="mt-4 space-y-3">
        {sections.map((section, index) => (
          <div
            className="rounded-md border border-neutral-800 bg-neutral-900 p-3"
            key={section.id}
          >
            <label className="flex items-center gap-3 text-sm text-neutral-100">
              <input
                checked={section.enabled}
                className="h-4 w-4 accent-cyan-300"
                onChange={() => onToggleSection(section.id)}
                type="checkbox"
              />
              <span className="min-w-0 flex-1">{section.title}</span>
            </label>
            <div className="mt-3 flex gap-2">
              <Button
                aria-label={`Move ${section.title} up`}
                disabled={index === 0}
                onClick={() => onMoveSection(section.id, "up")}
                size="icon"
                type="button"
                variant="ghost"
              >
                <ArrowUp aria-hidden="true" />
              </Button>
              <Button
                aria-label={`Move ${section.title} down`}
                disabled={index === sections.length - 1}
                onClick={() => onMoveSection(section.id, "down")}
                size="icon"
                type="button"
                variant="ghost"
              >
                <ArrowDown aria-hidden="true" />
              </Button>
              <span className="self-center text-xs uppercase text-neutral-500">
                {section.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
