// Applies a brand palette (e.g. colours extracted from a logo) to a report so
// the charts in both the preview and the PDF use those colours. When no palette
// is provided the report is returned unchanged (keeps the default brand palette).

function hexToRgb(hex) {
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

function rgbToHex({ r, g, b }) {
  const channel = (c) =>
    Math.max(0, Math.min(255, Math.round(c)))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function lerp(a, b, t) {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
}

// Produce `n` colours from the given stops. For n <= stops, takes the first n;
// otherwise interpolates evenly across the stops to create distinct shades.
export function expandPalette(colors, n) {
  const stops = (colors || []).map(hexToRgb).filter(Boolean);

  if (stops.length === 0 || n <= 0) {
    return [];
  }

  if (n <= stops.length) {
    return stops.slice(0, n).map(rgbToHex);
  }

  if (stops.length === 1) {
    return Array.from({ length: n }, () => rgbToHex(stops[0]));
  }

  const result = [];
  const segments = stops.length - 1;
  for (let i = 0; i < n; i += 1) {
    const pos = (i / (n - 1)) * segments;
    const index = Math.min(Math.floor(pos), segments - 1);
    result.push(rgbToHex(lerp(stops[index], stops[index + 1], pos - index)));
  }
  return result;
}

// Returns the report with breakdown and topCategories recoloured from `palette`.
// Pure: leaves the input untouched and returns the original when palette is empty.
export function themeReport(report, palette) {
  if (!report || !Array.isArray(palette) || palette.length === 0) {
    return report;
  }

  const breakdownColors = expandPalette(palette, report.breakdown.length);
  const topColors = expandPalette(palette, report.topCategories.length);

  if (breakdownColors.length === 0) {
    return report;
  }

  return {
    ...report,
    breakdown: report.breakdown.map((item, index) => ({
      ...item,
      color: breakdownColors[index] || item.color,
    })),
    topCategories: report.topCategories.map((item, index) => ({
      ...item,
      color: topColors[index] || item.color,
    })),
  };
}
