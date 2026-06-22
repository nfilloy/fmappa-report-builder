"use client";

import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <div className="flex flex-wrap items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
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
        </TooltipTrigger>
        <TooltipContent>
          {section.enabled ? "Hide from the PDF" : "Show in the PDF"}
        </TooltipContent>
      </Tooltip>

      {/* Up / Down as a single segmented control */}
      <div className="inline-flex items-center overflow-hidden rounded-lg border border-border">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Move section up"
              className="h-8 rounded-none border-0 px-2.5"
              onClick={() => onMove?.(section.id, "up")}
              size="sm"
              type="button"
              variant="ghost"
            >
              <ArrowUp aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Move up</TooltipContent>
        </Tooltip>
        <span aria-hidden="true" className="h-5 w-px bg-border" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Move section down"
              className="h-8 rounded-none border-0 px-2.5"
              onClick={() => onMove?.(section.id, "down")}
              size="sm"
              type="button"
              variant="ghost"
            >
              <ArrowDown aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Move down</TooltipContent>
        </Tooltip>
      </div>

      {section.removable ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onRemove?.(section.id)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Trash2 aria-hidden="true" />
              Delete
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete this custom section</TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => onDuplicate?.(section.id)}
              size="sm"
              type="button"
              variant="outline"
            >
              <Copy aria-hidden="true" />
              Copy
            </Button>
          </TooltipTrigger>
          <TooltipContent>Duplicate as an editable custom section</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
