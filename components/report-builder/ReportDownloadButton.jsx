"use client";

import { useEffect, useRef, useState } from "react";

import DownloadButton from "@/components/ui/button-download";

export function ReportDownloadButton({ className, onDownload, pdfLoading }) {
  // The DownloadButton is progress-driven, but the real PDF job only exposes a
  // boolean (`pdfLoading`). Creep toward ~90% while it runs, then snap to 100%.
  const [downloadStatus, setDownloadStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const wasDownloading = useRef(false);

  useEffect(() => {
    if (pdfLoading) {
      wasDownloading.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- drives progress animation from pdfLoading
      setDownloadStatus("downloading");
      setProgress((p) => (p < 8 ? 8 : p));
      const creep = setInterval(() => {
        setProgress((p) => (p >= 90 ? 90 : p + 3));
      }, 180);
      return () => clearInterval(creep);
    }

    if (wasDownloading.current) {
      wasDownloading.current = false;
      setProgress(100);
      setDownloadStatus("downloaded");
      const reset = setTimeout(() => {
        setDownloadStatus("idle");
        setProgress(0);
      }, 1200);
      return () => clearTimeout(reset);
    }

    return undefined;
  }, [pdfLoading]);

  const handleDownloadClick = () => {
    if (downloadStatus !== "idle") return;
    onDownload?.();
  };

  return (
    <DownloadButton
      className={className}
      downloadStatus={downloadStatus}
      onClick={handleDownloadClick}
      progress={progress}
    />
  );
}
