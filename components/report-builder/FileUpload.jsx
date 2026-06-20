"use client";

import { memo } from "react";
import { useRef } from "react";
import { Sparkles, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const FileUpload = memo(function FileUpload({
  onFileSelected,
  onLoadSampleOcf,
  onLoadSamplePcf,
  fileName,
  fill = false,
  compact = false,
}) {
  const inputRef = useRef(null);

  return (
    <div className={cn("flex flex-col gap-3", fill && "h-full")}>
      <label
        className={cn(
          "group relative flex min-w-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-secondary/40 px-5 text-center transition hover:border-primary hover:bg-accent/40 sm:px-6",
          compact ? "min-h-28 py-5" : "min-h-44 py-8",
          fill && "flex-1",
        )}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100 mappa-gradient-2"
          style={{
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.12), transparent 70%)",
          }}
        />
        <span className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-2xl mappa-gradient-1 text-white shadow-sm transition group-hover:scale-105">
          <Upload aria-hidden="true" className="h-6 w-6" />
        </span>
        <span className="relative max-w-full break-words text-base font-semibold text-foreground">
          {fileName || "Upload an OCF or PCF CSV file"}
        </span>
        {compact ? null : (
          <span className="relative mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            The file type is detected automatically. It is parsed in your browser, not
            uploaded or stored on a server.
          </span>
        )}
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          onChange={(event) => onFileSelected(event.target.files?.[0])}
          aria-label="Upload OCF or PCF CSV file"
          accept=".csv,text/csv"
        />
      </label>
      {onLoadSampleOcf || onLoadSamplePcf ? (
        <div className="grid grid-cols-2 gap-2">
          {onLoadSampleOcf ? (
            <Button
              className="w-full"
              onClick={onLoadSampleOcf}
              type="button"
              variant="ghost"
            >
              <Sparkles aria-hidden="true" />
              Sample OCF
            </Button>
          ) : null}
          {onLoadSamplePcf ? (
            <Button
              className="w-full"
              onClick={onLoadSamplePcf}
              type="button"
              variant="ghost"
            >
              <Sparkles aria-hidden="true" />
              Sample PCF
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});
