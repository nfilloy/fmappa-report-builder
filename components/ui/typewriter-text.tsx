"use client";

import * as React from "react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export interface TypewriterProps {
  text: string | string[];
  speed?: number;
  cursor?: string;
  loop?: boolean;
  deleteSpeed?: number;
  delay?: number;
  className?: string;
  cursorClassName?: string;
  containerClassName?: string;
}

export function Typewriter({
  text,
  speed = 100,
  cursor = "|",
  loop = false,
  deleteSpeed = 50,
  delay = 1500,
  className,
  cursorClassName,
  containerClassName,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);
  const [isPausing, setIsPausing] = useState(false);

  // Validate and process input text
  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[textArrayIndex] || "";

  useEffect(() => {
    if (!currentText) return;

    // When a word is fully typed, hold it for `delay` before deleting.
    if (isPausing) {
      const pause = setTimeout(() => {
        setIsPausing(false);
        setIsDeleting(true);
      }, delay);
      return () => clearTimeout(pause);
    }

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText((prev) => prev + currentText[currentIndex]);
            setCurrentIndex((prev) => prev + 1);
          } else if (loop) {
            setIsPausing(true);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText((prev) => prev.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentIndex(0);
            setTextArrayIndex((prev) => (prev + 1) % textArray.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed,
    );

    return () => clearTimeout(timeout);
  }, [
    currentIndex,
    isDeleting,
    isPausing,
    currentText,
    loop,
    speed,
    deleteSpeed,
    delay,
    displayText,
    textArray.length,
  ]);

  return (
    <span className={cn("inline-flex items-baseline", containerClassName)}>
      <span className={className}>{displayText}</span>
      <span
        aria-hidden="true"
        className={cn(
          "ml-1 inline-block h-[0.85em] w-[2px] animate-pulse rounded-full bg-current align-[-0.05em]",
          cursorClassName,
        )}
      >
        {/* thin bar cursor */}
      </span>
    </span>
  );
}
