"use client"

import { Download, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DownloadButtonProps {
    downloadStatus: "idle" | "downloading" | "downloaded" | "complete"
    progress: number
    onClick: () => void
    className?: string
}

export default function DownloadButton({ downloadStatus, progress, onClick, className }: DownloadButtonProps) {
    return (
        <Button
            variant="default"
            size="default"
            aria-label="Download report"
            onClick={onClick}
            className={cn(
                // Icon-only below `sm` (square button) so the header cluster fits a
                // 320px viewport; full icon + label from `sm` up.
                "rounded-xl relative overflow-hidden select-none w-10 px-0 sm:w-40 sm:px-5",
                downloadStatus === "downloading" && "bg-primary/50 hover:bg-primary/50",
                downloadStatus !== "idle" && "pointer-events-none",
                className,
            )}
        >
            {downloadStatus === "idle" && (
                <>
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                </>
            )}
            {downloadStatus === "downloading" && (
                <div className="z-[5] flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                    <span className="hidden sm:inline">{progress}%</span>
                </div>
            )}
            {downloadStatus === "downloaded" && (
                <>
                    <CheckCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Downloaded</span>
                </>
            )}
            {downloadStatus === "complete" && <span className="text-primary">Download</span>}
            {downloadStatus === "downloading" && (
                <div
                    className="absolute bottom-0 z-[3] h-full left-0 bg-primary inset-0 transition-all duration-200 ease-in-out"
                    style={{ width: `${progress}%` }}
                />
            )}
        </Button>
    )
}
