"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ACCENT_COLORS = [
  { label: "Relats red", value: "#b91c1c" },
  { label: "Graphite", value: "#18181b" },
  { label: "Cyan", value: "#0891b2" },
  { label: "Emerald", value: "#059669" },
];

export function ReportSettingsPanel({ settings, onChange }) {
  const logoInputRef = useRef(null);

  function updateSetting(key, value) {
    onChange({ ...settings, [key]: value });
  }

  function handleLogoChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateSetting("logoDataUrl", reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <Card>
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
        <div className="grid grid-cols-2 gap-3">
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
        <label className="block text-sm font-medium text-foreground">
          Prepared by
          <Input
            className="mt-2"
            onChange={(event) => updateSetting("preparedBy", event.target.value)}
            value={settings.preparedBy}
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
          <div className="mt-3 flex items-center gap-3">
            {settings.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL preview
              <img
                alt="Client logo preview"
                className="h-10 w-auto max-w-[120px] rounded-md border border-border bg-white object-contain p-1"
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
                onClick={() => updateSetting("logoDataUrl", "")}
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

        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          <p className="text-sm font-semibold text-foreground">Accent color</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Accent colour of the exported Relats report (not the app theme).
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {ACCENT_COLORS.map((color) => (
              <button
                aria-label={`Use ${color.label} accent`}
                className="h-9 rounded-md border border-border outline-none ring-offset-2 ring-offset-background transition focus:ring-2 focus:ring-ring"
                key={color.value}
                onClick={() => updateSetting("accentColor", color.value)}
                style={{
                  backgroundColor: color.value,
                  boxShadow:
                    settings.accentColor === color.value
                      ? "0 0 0 2px var(--primary)"
                      : "none",
                }}
                type="button"
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
