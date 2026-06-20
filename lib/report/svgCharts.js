import { formatEmissions, formatPercent } from "@/lib/formatters";

// Pure SVG chart generators shared by the browser preview (HtmlReport) and the
// server-rendered PDF (renderHtmlReport), so both stay pixel-identical.

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function truncate(value, max) {
  const text = String(value ?? "");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// Donut showing the relative weight of each breakdown item, with the total in
// the centre. `breakdown` items must carry { label, value, color }.
export function donutSvg({ breakdown, total, unit }) {
  const size = 168;
  const stroke = 30;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const sum = breakdown.reduce((acc, item) => acc + Math.max(item.value, 0), 0);

  let offset = 0;
  const segments = sum
    ? breakdown
        .filter((item) => item.value > 0)
        .map((item) => {
          const fraction = Math.max(item.value, 0) / sum;
          const dash = fraction * circumference;
          const circle = `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${item.color}" stroke-width="${stroke}" stroke-dasharray="${dash.toFixed(2)} ${(circumference - dash).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})" />`;
          offset += dash;
          return circle;
        })
        .join("")
    : "";

  return `
    <svg class="donut-chart" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Breakdown donut chart">
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#ececec" stroke-width="${stroke}" />
      ${segments}
      <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="9" fill="#78716c" letter-spacing="0.5">TOTAL</text>
      <text x="${cx}" y="${cy + 11}" text-anchor="middle" font-size="13" font-weight="700" fill="#18181b">${escapeHtml(formatEmissions(total, unit))}</text>
    </svg>`;
}

// Horizontal stacked bars comparing entities by total height and composition by
// column. `colors` aligns with `columns` order.
export function stackedBarSvg({ entities, columns, colors, unit }) {
  const rowHeight = 34;
  const barHeight = 16;
  const labelGap = 16;
  const width = 640;
  const legendHeight = 26;
  const height = legendHeight + entities.length * rowHeight + 4;
  const maxTotal = entities.reduce(
    (max, entity) => Math.max(max, entity.totalEmissions),
    0,
  );
  const trackW = width;

  const legend = columns
    .map((column, index) => {
      const x = (index / columns.length) * width;
      return `<g transform="translate(${x.toFixed(1)} 0)">
        <rect x="0" y="2" width="9" height="9" rx="2" fill="${colors[index % colors.length]}" />
        <text x="14" y="10" font-size="9" fill="#57534e">${escapeHtml(truncate(column.label, 16))}</text>
      </g>`;
    })
    .join("");

  const rows = entities
    .map((entity, rowIndex) => {
      const top = legendHeight + rowIndex * rowHeight;
      const barTop = top + labelGap;
      const barW = maxTotal > 0 ? (entity.totalEmissions / maxTotal) * trackW : 0;

      let segX = 0;
      const segs = columns
        .map((column, index) => {
          const value = Math.max(entity.values[column.key] || 0, 0);
          const w = entity.totalEmissions > 0 ? (value / entity.totalEmissions) * barW : 0;
          const rect = `<rect x="${segX.toFixed(2)}" y="${barTop}" width="${Math.max(w, 0).toFixed(2)}" height="${barHeight}" fill="${colors[index % colors.length]}" />`;
          segX += w;
          return rect;
        })
        .join("");

      return `<g>
        <text x="0" y="${top + 11}" font-size="10" font-weight="600" fill="#292524">${escapeHtml(truncate(entity.name, 42))}</text>
        <text x="${width}" y="${top + 11}" text-anchor="end" font-size="10" fill="#57534e">${escapeHtml(formatEmissions(entity.totalEmissions, unit))}</text>
        ${segs}
      </g>`;
    })
    .join("");

  return `
    <svg class="stacked-bar-chart" viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="xMinYMin meet" role="img" aria-label="Stacked emissions by entity">
      ${legend}
      ${rows}
    </svg>`;
}

// Convenience: legend list (colour + label + value + percent) used next to the
// donut so the chart section reads clearly in both preview and PDF.
export function breakdownLegendHtml({ breakdown, unit }) {
  return `<ul class="chart-legend">${breakdown
    .map(
      (item) => `<li>
        <span class="chart-legend__dot" style="background:${item.color}"></span>
        <span class="chart-legend__label">${escapeHtml(item.label)}</span>
        <span class="chart-legend__value">${escapeHtml(formatEmissions(item.value, unit))} · ${escapeHtml(formatPercent(item.percentage))}</span>
      </li>`,
    )
    .join("")}</ul>`;
}
