"use client";

import { useEffect, useState } from "react";
import { Toaster as Sonner } from "sonner";

/**
 * Themed wrapper around Sonner. The project toggles dark mode by adding a
 * `dark` class to <html> (no next-themes), so we watch that class and feed the
 * resolved theme to Sonner, while mapping its surface colours to our tokens.
 */
export function Toaster(props) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const root = document.documentElement;
    const sync = () =>
      setTheme(root.classList.contains("dark") ? "dark" : "light");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      richColors
      theme={theme}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-xl group-[.toaster]:border-border group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      style={{
        "--normal-bg": "var(--card)",
        "--normal-text": "var(--foreground)",
        "--normal-border": "var(--border)",
      }}
      {...props}
    />
  );
}
