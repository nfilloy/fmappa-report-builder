"use client";

import { useRef } from "react";
import { Sparkles, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FileUpload({ onFileSelected, onLoadSample, fileName }) {
  const inputRef = useRef(null);

  return (
    <div className="space-y-3">
      <label className="group relative flex min-h-44 min-w-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-secondary/40 px-5 py-8 text-center transition hover:border-primary hover:bg-accent/40 sm:px-6">
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
          {fileName || "Upload an OCF CSV file"}
        </span>
        <span className="relative mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          The file is parsed in your browser. It is not uploaded or stored on a server.
        </span>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          onChange={(event) => onFileSelected(event.target.files?.[0])}
          aria-label="Upload OCF CSV file"
          accept=".csv,text/csv"
        />
      </label>
      {onLoadSample ? (
        <Button
          className="w-full"
          onClick={onLoadSample}
          type="button"
          variant="ghost"
        >
          <Sparkles aria-hidden="true" />
          Load sample OCF
        </Button>
      ) : null}
    </div>
  );
}
