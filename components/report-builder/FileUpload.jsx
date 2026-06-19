"use client";

import { useEffect, useRef } from "react";
import { Upload } from "lucide-react";

export function FileUpload({ onFileSelected, fileName }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const input = inputRef.current;

    if (!input) {
      return undefined;
    }

    function handleFileEvent(event) {
      onFileSelected(event.target.files?.[0]);
    }

    input.addEventListener("change", handleFileEvent);
    input.addEventListener("input", handleFileEvent);

    return () => {
      input.removeEventListener("change", handleFileEvent);
      input.removeEventListener("input", handleFileEvent);
    };
  }, [onFileSelected]);

  return (
    <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-neutral-600 bg-neutral-950 px-6 py-8 text-center transition hover:border-neutral-400">
      <Upload aria-hidden="true" className="mb-4 h-8 w-8 text-cyan-300" />
      <span className="text-base font-medium text-white">
        {fileName || "Upload an OCF CSV file"}
      </span>
      <span className="mt-2 max-w-md text-sm leading-6 text-neutral-400">
        The file is parsed in your browser. It is not uploaded or stored on a server.
      </span>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        aria-label="Upload OCF CSV file"
        accept=".csv,text/csv"
      />
    </label>
  );
}
