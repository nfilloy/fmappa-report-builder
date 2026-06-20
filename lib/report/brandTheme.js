// Single source of truth for the report's brand colours. Pure (no DOM), so the
// browser preview and the server-side PDF render derive identical colours.
//
// The report "chrome" (cover, section numbers, badges, progress fills, PDF
// header/footer) is tinted by ONE accent: derived from the client logo, or
// Mappa navy when there is no logo. The data charts are NOT themed here — they
// always use the fixed, accessible Mappa palette (see lib/report/chartTheme.js,
// applied in lib/data/ocf.js and lib/data/pcf.js) for legibility and
// consistency across reports.

import { BRAND } from "./chartTheme.js";
import { bestTextOn, ensureReadable } from "../color/contrast.js";

const DEFAULT_ACCENT = BRAND.navy;

function safeHex(value) {
  const color = String(value ?? "");
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color.toLowerCase() : null;
}

// Derives the accent + matching text colour from report settings.
//   accent    – chrome tint, guaranteed legible on the white report page
//   onAccent  – text/icon colour to use on top of the accent
//   source    – where the accent came from ("logo" | "manual" | "mappa")
export function buildBrandTheme(settings) {
  const rawAccent = safeHex(settings?.accentColor);
  const source = rawAccent
    ? settings?.accentSource === "logo"
      ? "logo"
      : "manual"
    : "mappa";

  const accent = ensureReadable(rawAccent || DEFAULT_ACCENT, {
    against: "#ffffff",
    min: 3,
  });

  return {
    source,
    accent,
    onAccent: bestTextOn(accent),
  };
}
