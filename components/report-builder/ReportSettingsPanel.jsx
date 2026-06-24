"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Layers, Palette, RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/ui/info-hint";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/report/chartTheme";
import { RELATS_RED } from "@/lib/report/brandTheme";
import { extractPalette } from "@/lib/color/extractPalette";
import { ensureReadable } from "@/lib/color/contrast";

// PCF-only system boundary options. cradle-to-gate is the default.
const BOUNDARY_OPTIONS = [
  { label: "Cradle-to-gate", value: "cradle-to-gate" },
  { label: "Cradle-to-grave", value: "cradle-to-grave" },
];

const ACCENT_PRESETS = [
  { label: "Relats red", value: RELATS_RED },
  { label: "Mappa navy", value: BRAND.navy },
  { label: "Mappa teal", value: BRAND.teal },
  { label: "Mappa coral", value: BRAND.coral },
  { label: "Mappa peach", value: BRAND.peach },
  { label: "Graphite", value: "#18181b" },
];

// Returns a normalised #rrggbb string, or null when the input is not a valid
// 6-digit hex colour (accepts values with or without a leading #, any case).
function normalizeHex(value) {
  const hex = String(value ?? "").trim().replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(hex) ? `#${hex.toLowerCase()}` : null;
}

// Parse a comma-separated string into a trimmed, non-empty list of sources.
function parseSources(text) {
  return String(text ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

// Comma-separated editor for the data-sources list. Keeps a local text buffer so
// the user can type commas freely; the parsed array is propagated on every
// change, and the buffer re-syncs when the external value changes (CSV load /
// reset) without clobbering mid-edit. Resync is done during render (React's
// recommended pattern) rather than in an effect.
function DataSourcesField({ value, onChange }) {
  const joined = (value || []).join(", ");
  const [text, setText] = useState(joined);
  const [lastJoined, setLastJoined] = useState(joined);

  if (joined !== lastJoined) {
    setLastJoined(joined);
    if (parseSources(text).join(", ") !== joined) {
      setText(joined);
    }
  }

  return (
    <Input
      className="mt-2"
      onChange={(event) => {
        setText(event.target.value);
        onChange(parseSources(event.target.value));
      }}
      placeholder="DEFRA, IEA, ecoinvent"
      value={text}
    />
  );
}

export const ReportSettingsPanel = memo(function ReportSettingsPanel({
  settings,
  onChange,
  report,
  boundary,
  onBoundaryChange,
  framed = true,
}) {
  const isPcf = report?.kind === "pcf";
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
          ? { accentColor: ensureReadable(colors[0]), accentSource: "logo" }
          : {}),
      });
      if (colors.length) {
        bumpColorVersion();
      }
    };
    reader.readAsDataURL(file);
  }

  async function resyncAccentFromLogo() {
    if (!settings.logoDataUrl) {
      return;
    }

    const colors = await extractPalette(settings.logoDataUrl);

    if (colors.length) {
      onChange({
        ...settings,
        accentColor: ensureReadable(colors[0]),
        accentSource: "logo",
      });
      bumpColorVersion();
    }
  }

  const fields = (
    <div className="space-y-4">
        {isPcf ? (
          <div className="rounded-xl border border-border bg-secondary/40 p-4">
            <div className="flex items-center gap-2.5">
              <span className="mappa-gradient-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-sm">
                <Layers aria-hidden="true" className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold text-foreground">System boundary</p>
              <InfoHint label="About the system boundary">
                Cradle-to-gate counts raw materials, manufacturing and inbound
                transport up to the factory gate; cradle-to-grave adds the
                downstream distribution, use and end-of-life stages.
              </InfoHint>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              PCF reporting boundary. Changing it recomputes the footprint and
              regenerates the report section copy.
            </p>
            <div
              aria-label="System boundary"
              className="mt-3 grid grid-cols-2 gap-2"
              role="group"
            >
              {BOUNDARY_OPTIONS.map((option) => {
                const isActive = boundary === option.value;
                return (
                  <button
                    aria-pressed={isActive}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                    key={option.value}
                    onClick={() => onBoundaryChange?.(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <label className="block text-sm font-medium text-foreground">
          <span className="flex items-center gap-1.5">
            Client name
            <InfoHint label="About the client name">
              The company the report is prepared for. It appears on the cover and
              flows through the generated narrative copy.
            </InfoHint>
          </span>
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
            onChange={(event) =>
              onChange({
                ...settings,
                reportLabel: event.target.value,
                // Pin the custom label so it survives later year changes.
                reportLabelDirty: true,
              })
            }
            value={settings.reportLabel}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-foreground">
            <span className="flex items-center gap-1.5">
              Report year
              <InfoHint label="About the report year">
                The reporting period covered. It drives the report title, cover
                and page headers unless you pin a custom label.
              </InfoHint>
            </span>
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
          <span className="flex items-center gap-1.5">
            Data sources
            <InfoHint label="About data sources">
              Emission-factor databases behind the figures (e.g. DEFRA,
              ecoinvent). Shown in the methodology badges and prose.
            </InfoHint>
          </span>
          <DataSourcesField
            onChange={(sources) => updateSetting("dataSources", sources)}
            value={settings.dataSources}
          />
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            Comma-separated. Shown in the methodology badges and prose.
          </span>
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
          <div className="flex items-center gap-2.5">
            <span className="mappa-gradient-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-sm">
              <ImagePlus aria-hidden="true" className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-foreground">Client logo</p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Embedded on the report cover. Uploading a logo also derives the
            report accent colour from it; remove it to fall back to Mappa.
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
              <>
                <Button
                  onClick={resyncAccentFromLogo}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <RefreshCw aria-hidden="true" />
                  Sync accent
                </Button>
                <Button
                  aria-label="Remove logo"
                  className="hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    onChange({
                      ...settings,
                      logoDataUrl: "",
                      accentColor: RELATS_RED,
                      accentSource: "brand",
                    });
                    bumpColorVersion();
                  }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <X aria-hidden="true" />
                </Button>
              </>
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

        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          <div className="flex items-center gap-2.5">
            <span className="mappa-gradient-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-sm">
              <Palette aria-hidden="true" className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-foreground">Accent color</p>
            <InfoHint label="About the accent color">
              Brand accent for the exported report cover, headings and badges.
              Derived from the client logo when one is uploaded. Data charts keep
              the fixed Mappa palette for legibility.
            </InfoHint>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Brand accent of the exported report (cover, headings, badges). Charts
            keep the fixed Mappa palette. Derived from the logo when one is set.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-card p-1.5">
            <input
              aria-label="Pick accent colour"
              className="h-8 w-10 shrink-0 cursor-pointer rounded-md border border-border bg-card p-0.5"
              key={`accent-${colorVersion}`}
              onBlur={flushColor}
              onChange={(event) => {
                const value = event.target.value;
                scheduleColorCommit((prev) => ({
                  ...prev,
                  accentColor: value,
                  accentSource: "manual",
                }));
              }}
              type="color"
              defaultValue={normalizeHex(settings.accentColor) || BRAND.navy}
            />
            <Input
              aria-label="Accent colour hex"
              className="h-8 border-0 bg-transparent font-mono uppercase shadow-none focus-visible:ring-0"
              onChange={(event) => {
                const next = normalizeHex(event.target.value);
                if (next) {
                  onChange({ ...settings, accentColor: next, accentSource: "manual" });
                }
              }}
              placeholder={BRAND.navy}
              defaultValue={settings.accentColor}
              key={`hex-${colorVersion}`}
            />
          </div>
          <div className="mt-3 grid grid-cols-6 gap-2">
            {ACCENT_PRESETS.map((color) => {
              const isActive =
                normalizeHex(settings.accentColor) === color.value.toLowerCase();
              return (
                <button
                  aria-label={`Use ${color.label} accent`}
                  aria-pressed={isActive}
                  className={cn(
                    "relative flex h-9 items-center justify-center rounded-lg border border-black/10 outline-none ring-offset-2 ring-offset-background transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring",
                    isActive && "scale-110",
                  )}
                  key={color.value}
                  onClick={() => {
                    onChange({
                      ...settings,
                      accentColor: color.value,
                      accentSource: "manual",
                    });
                    bumpColorVersion();
                  }}
                  style={{
                    backgroundColor: color.value,
                    boxShadow: isActive ? "0 0 0 2px var(--primary)" : "none",
                  }}
                  title={color.label}
                  type="button"
                >
                  {isActive ? (
                    <Check
                      aria-hidden="true"
                      className="h-4 w-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
                      strokeWidth={3}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <details className="group min-w-0 rounded-xl border border-border bg-secondary/40 p-4">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-foreground">
            Glossary
            <span className="text-xs font-normal text-muted-foreground">
              key terms
            </span>
          </summary>
          <dl className="mt-3 space-y-2 text-xs leading-snug text-muted-foreground">
            <div>
              <dt className="font-semibold text-foreground">Scope 1 / 2 / 3</dt>
              <dd>
                Direct emissions (Scope 1), purchased energy (Scope 2) and wider
                value-chain emissions (Scope 3).
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">
                Cradle-to-gate vs cradle-to-grave
              </dt>
              <dd>
                Up to the factory gate vs the full life cycle including
                distribution, use and end of life.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Functional unit</dt>
              <dd>
                The reference flow a product&apos;s emissions are measured
                against, so different products stay comparable.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">CO₂e</dt>
              <dd>
                Carbon-dioxide equivalent — all greenhouse gases expressed on a
                common warming-potential scale.
              </dd>
            </div>
          </dl>
        </details>
    </div>
  );

  if (!framed) {
    return fields;
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Report branding</CardTitle>
      </CardHeader>
      <CardContent>
        {fields}
      </CardContent>
    </Card>
  );
});
