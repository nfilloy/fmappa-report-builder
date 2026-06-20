// WCAG colour-contrast helpers. Pure: no DOM, so they run both in the browser
// preview and in the server-side PDF render. Used to keep the report accent
// legible on white and to pick readable text on top of the accent.

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function toHex(r, g, b) {
  const channel = (value) => clampChannel(value).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

export function hexToRgb(hex) {
  const value = String(hex || "").replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return null;
  }
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

// Moves a colour toward black (factor < 0) or white (factor > 0).
export function shade(hex, factor) {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return hex;
  }
  const mix = (c) => (factor >= 0 ? c + (255 - c) * factor : c * (1 + factor));
  return toHex(mix(rgb.r), mix(rgb.g), mix(rgb.b));
}

function channelLuminance(value) {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return 0;
  }
  return (
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b)
  );
}

// WCAG relative-contrast ratio between two colours (1 to 21).
export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// Returns the text colour (graphite or white) with the better contrast on `bg`.
export function bestTextOn(bg) {
  const dark = "#18181b";
  const light = "#ffffff";
  return contrastRatio(bg, dark) >= contrastRatio(bg, light) ? dark : light;
}

// Darkens a colour step by step until it meets the minimum contrast against a
// light background (default white). This keeps an accent extracted from a pale
// logo from becoming near-invisible on the white report background. Assumes
// `against` is a light colour, which is always the case here (the report page).
export function ensureReadable(color, { against = "#ffffff", min = 3 } = {}) {
  const base = hexToRgb(color) ? color : "#18181b";
  if (contrastRatio(base, against) >= min) {
    return base;
  }
  let current = base;
  for (let step = 1; step <= 20; step += 1) {
    current = shade(base, -0.05 * step);
    if (contrastRatio(current, against) >= min) {
      return current;
    }
  }
  return current;
}
