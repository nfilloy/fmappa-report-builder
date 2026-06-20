"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BRAND } from "@/lib/report/chartTheme";
import { extractPalette } from "@/lib/color/extractPalette";

const ACCENT_PRESETS = [
  { label: "Relats red", value: "#b91c1c" },
  { label: "Graphite", value: "#18181b" },
  { label: "Mappa navy", value: BRAND.navy },
  { label: "Mappa coral", value: BRAND.coral },
  { label: "Mappa peach", value: BRAND.peach },
  { label: "Mappa teal", value: BRAND.teal },
];

// Returns a normalised #rrggbb string, or null when the input is not a valid
// 6-digit hex colour (accepts values with or without a leading #, any case).
function normalizeHex(value) {
  const hex = String(value ?? "").trim().replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(hex) ? `#${hex.toLowerCase()}` : null;
}

export const ReportSettingsPanel = memo(function ReportSettingsPanel({ settings, onChange }) {
  const logoInputRef = useRef(null);
  // Native colour inputs are uncontrolled (defaultValue) to avoid a feedback
  // loop where writing `value` back into an open picker re-fires onChange. This
  // counter remounts them only on external colour changes (logo / reset / preset).
  const [colorVersion, setColorVersion] = useState(0);

  const bumpColorVersion = useCallback(() => {
    setColorVersion((version) => version + 1);
  }, []);

  const updateSetting = useCallback((key, value) => {
    onChange({ ...settings, [key]: value });
  }, [onChange, settings]);

  // Native colour pickers fire onChange dozens of times per second while
  // dragging. Propagating each one re-renders the whole report tree (preview,
  // animated KPIs, recharts), which can hit React's update-depth limit. We
  // debounce the propagation and flush on blur (picker close); the input itself
  // stays uncontrolled so the swatch follows the drag with no lag.
  const commitTimer = useRef(null);
  const pendingUpdater = useRef(null);

  function flushColor() {
    if (commitTimer.current) {
      clearTimeout(commitTimer.current);
      commitTimer.current = null;
    }
    if (pendingUpdater.current) {
      const updater = pendingUpdater.current;
      pendingUpdater.current = null;
      onChange(updater);
    }
  }

  function scheduleColorCommit(updater) {
    pendingUpdater.current = updater;
    if (commitTimer.current) {
      return;
    }
    commitTimer.current = setTimeout(() => {
      commitTimer.current = null;
      flushColor();
    }, 120);
  }

  useEffect(() => () => clearTimeout(commitTimer.current), []);

  function handleLogoChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== "string") {
        return;
      }

      const dataUrl = reader.result;
      const colors = await extractPalette(dataUrl);

      onChange({
        ...settings,
        logoDataUrl: dataUrl,
        ...(colors.length
          ? { palette: colors, accentColor: colors[0] }
          : {}),
      });
      if (colors.length) {
        bumpColorVersion();
      }
    };
    reader.readAsDataURL(file);
  }

  async function resetPaletteFromLogo() {
    if (!settings.logoDataUrl) {
      return;
    }

    const colors = await extractPalette(settings.logoDataUrl);

    if (colors.length) {
      onChange({ ...settings, palette: colors, accentColor: colors[0] });
      bumpColorVersion();
    }
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Report branding</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="block text-sm font-medium text-foreground">
          Client name
          <Input
            className="mt-2"
            onChange={(event) => updateSetting("clientName", event.target.value)}
            value={settings.clientName}
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Report label
          <Input
            className="mt-2"
            onChange={(event) => updateSetting("reportLabel", event.target.value)}
            value={settings.reportLabel}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-foreground">
            Report year
            <Input
              className="mt-2"
              onChange={(event) => updateSetting("reportYear", event.target.value)}
              value={settings.reportYear}
            />
          </label>
          <label className="block text-sm font-medium text-foreground">
            Reporting period
            <Input
              className="mt-2"
              onChange={(event) =>
                updateSetting("reportingPeriod", event.target.value)
              }
              placeholder="Jan–Dec 2024"
              value={settings.reportingPeriod}
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-foreground">
            Prepared by
            <Input
              className="mt-2"
              onChange={(event) => updateSetting("preparedBy", event.target.value)}
              value={settings.preparedBy}
            />
          </label>
          <label className="block text-sm font-medium text-foreground">
            Prepared for
            <Input
              className="mt-2"
              onChange={(event) => updateSetting("preparedFor", event.target.value)}
              placeholder="Optional client contact"
              value={settings.preparedFor || ""}
            />
          </label>
        </div>
        <label className="block text-sm font-medium text-foreground">
          Report date
          <Input
            className="mt-2"
            onChange={(event) => updateSetting("reportDate", event.target.value)}
            placeholder="e.g. June 2025"
            value={settings.reportDate || ""}
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Cover subtitle
          <Textarea
            className="mt-2 min-h-16"
            onChange={(event) => updateSetting("subtitle", event.target.value)}
            placeholder="Leave blank to use the default subtitle for this report type."
            value={settings.subtitle || ""}
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Calculation basis label
          <Input
            className="mt-2"
            onChange={(event) => updateSetting("totalSourceLabel", event.target.value)}
            placeholder="Leave blank to use the detected basis."
            value={settings.totalSourceLabel || ""}
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Notes / assumptions
          <Textarea
            className="mt-2 min-h-20"
            onChange={(event) => updateSetting("notes", event.target.value)}
            placeholder="Optional note shown on the report cover."
            value={settings.notes}
          />
        </label>

        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          <p className="text-sm font-semibold text-foreground">Client logo</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Optional logo embedded on the exported report cover.
          </p>
          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-3">
            {settings.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL preview
              <img
                alt="Client logo preview"
                className="h-10 w-auto max-w-[120px] shrink rounded-md border border-border bg-white object-contain p-1"
                src={settings.logoDataUrl}
              />
            ) : null}
            <Button
              onClick={() => logoInputRef.current?.click()}
              size="sm"
              type="button"
              variant="outline"
            >
              <ImagePlus aria-hidden="true" />
              {settings.logoDataUrl ? "Replace" : "Upload logo"}
            </Button>
            {settings.logoDataUrl ? (
              <Button
                aria-label="Remove logo"
                onClick={() => {
                  onChange({ ...settings, logoDataUrl: "", palette: [] });
                  bumpColorVersion();
                }}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" />
              </Button>
            ) : null}
            <input
              accept="image/*"
              className="sr-only"
              onChange={handleLogoChange}
              ref={logoInputRef}
              type="file"
            />
          </div>
        </div>

        {settings.palette?.length ? (
          <div className="rounded-xl border border-border bg-secondary/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">Brand palette</p>
              <Button
                disabled={!settings.logoDataUrl}
                onClick={resetPaletteFromLogo}
                size="sm"
                type="button"
                variant="ghost"
              >
                <RefreshCw aria-hidden="true" />
                Reset to logo
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Extracted from the logo and used to colour the PDF charts. Edit any
              swatch to override.
            </p>
            <div className="mt-3 flex gap-2">
              {settings.palette.map((color, index) => (
                <input
                  aria-label={`Palette colour ${index + 1}`}
                  className="h-9 flex-1 cursor-pointer rounded-md border border-border bg-card p-1"
                  key={`palette-${colorVersion}-${index}`}
                  onBlur={flushColor}
                  onChange={(event) => {
                    const value = event.target.value;
                    scheduleColorCommit((prev) => ({
                      ...prev,
                      palette: (prev.palette || []).map((c, i) =>
                        i === index ? value : c,
                      ),
                    }));
                  }}
                  type="color"
                  defaultValue={normalizeHex(color) || "#000000"}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          <p className="text-sm font-semibold text-foreground">Accent color</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Accent colour of the exported Relats report (not the app theme).
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              aria-label="Pick accent colour"
              className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-border bg-card p-1"
              key={`accent-${colorVersion}`}
              onBlur={flushColor}
              onChange={(event) => {
                const value = event.target.value;
                scheduleColorCommit((prev) => ({ ...prev, accentColor: value }));
              }}
              type="color"
              defaultValue={normalizeHex(settings.accentColor) || "#b91c1c"}
            />
            <Input
              aria-label="Accent colour hex"
              className="font-mono uppercase"
              onChange={(event) => {
                const next = normalizeHex(event.target.value);
                if (next) {
                  updateSetting("accentColor", next);
                }
              }}
              placeholder="#b91c1c"
              defaultValue={settings.accentColor}
              key={`hex-${colorVersion}`}
            />
          </div>
          <div className="mt-3 grid grid-cols-6 gap-2">
            {ACCENT_PRESETS.map((color) => (
              <button
                aria-label={`Use ${color.label} accent`}
                className="h-8 rounded-md border border-border outline-none ring-offset-2 ring-offset-background transition focus:ring-2 focus:ring-ring"
                key={color.value}
                onClick={() => {
                  updateSetting("accentColor", color.value);
                  bumpColorVersion();
                }}
                style={{
                  backgroundColor: color.value,
                  boxShadow:
                    normalizeHex(settings.accentColor) === color.value.toLowerCase()
                      ? "0 0 0 2px var(--primary)"
                      : "none",
                }}
                title={color.label}
                type="button"
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
