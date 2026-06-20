"use client";

import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SectionActionButtons({
  onDuplicate,
  onMove,
  onRemove,
  onToggle,
  section,
}) {
  if (!section) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      <Button
        onClick={() => onToggle?.(section.id)}
        size="sm"
        type="button"
        variant="outline"
      >
        {section.enabled ? (
          <EyeOff aria-hidden="true" />
        ) : (
          <Eye aria-hidden="true" />
        )}
        {section.enabled ? "Hide" : "Show"}
      </Button>
      <Button
        onClick={() => onMove?.(section.id, "up")}
        size="sm"
        type="button"
        variant="outline"
      >
        <ArrowUp aria-hidden="true" />
        Up
      </Button>
      <Button
        onClick={() => onMove?.(section.id, "down")}
        size="sm"
        type="button"
        variant="outline"
      >
        <ArrowDown aria-hidden="true" />
        Down
      </Button>
      {section.removable ? (
        <Button
          onClick={() => onRemove?.(section.id)}
          size="sm"
          type="button"
          variant="outline"
        >
          <Trash2 aria-hidden="true" />
          Delete
        </Button>
      ) : (
        <Button
          onClick={() => onDuplicate?.(section.id)}
          size="sm"
          type="button"
          variant="outline"
        >
          <Copy aria-hidden="true" />
          Copy
        </Button>
      )}
    </div>
  );
}
