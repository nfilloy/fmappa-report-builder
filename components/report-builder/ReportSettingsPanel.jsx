"use client";

const ACCENT_COLORS = [
  { label: "Cyan", value: "#0891b2" },
  { label: "Emerald", value: "#059669" },
  { label: "Amber", value: "#d97706" },
  { label: "Slate", value: "#334155" },
];

export function ReportSettingsPanel({ settings, onChange }) {
  function updateSetting(key, value) {
    onChange({ ...settings, [key]: value });
  }

  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
      <h2 className="text-lg font-semibold text-white">Branding</h2>
      <div className="mt-4 space-y-4">
        <label className="block text-sm text-neutral-300">
          Client name
          <input
            className="mt-2 h-10 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-cyan-300"
            onChange={(event) => updateSetting("clientName", event.target.value)}
            type="text"
            value={settings.clientName}
          />
        </label>
        <label className="block text-sm text-neutral-300">
          Report label
          <input
            className="mt-2 h-10 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-cyan-300"
            onChange={(event) => updateSetting("reportLabel", event.target.value)}
            type="text"
            value={settings.reportLabel}
          />
        </label>
        <div>
          <p className="text-sm text-neutral-300">Accent color</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {ACCENT_COLORS.map((color) => (
              <button
                aria-label={`Use ${color.label} accent`}
                className="h-9 rounded-md border border-neutral-700 outline-none ring-offset-2 ring-offset-neutral-950 focus:ring-2 focus:ring-white"
                key={color.value}
                onClick={() => updateSetting("accentColor", color.value)}
                style={{
                  backgroundColor: color.value,
                  boxShadow:
                    settings.accentColor === color.value
                      ? "0 0 0 2px white"
                      : "none",
                }}
                type="button"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
