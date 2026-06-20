import { readFileSync } from "node:fs";
import { join } from "node:path";

import { formatEmissions, formatPercent } from "@/lib/formatters";
import { HTML_REPORT_STYLES } from "@/lib/report/htmlReportStyles";
import { maxByValue, percentageOfMax } from "@/lib/report/chartData";
import { SEQUENTIAL_COLORS } from "@/lib/report/chartTheme";
import { buildBrandTheme } from "@/lib/report/brandTheme";
import { enabledSections } from "@/lib/report/sections";
import {
  breakdownLegendHtml,
  donutSvg,
  stackedBarSvg,
} from "@/lib/report/svgCharts";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeImageSrc(value) {
  const src = String(value ?? "");
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=\s]+$/.test(src)
    ? src
    : "";
}

function shortEntityName(name) {
  return String(name ?? "").replace("Planta ", "");
}

function paragraphs(content) {
  return String(content || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function textSection(section) {
  return paragraphs(section.content)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
}

function sectionIntro(section) {
  const intro = textSection(section);

  if (!intro) {
    return "";
  }

  return `<div class="section-intro">${intro}</div>`;
}

function insightsSection(section) {
  return `<ul class="insight-list">${paragraphs(section.content)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
}

function narrativeAnalysisSection(section) {
  return `<div class="analysis-block">${paragraphs(section.content)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("")}</div>`;
}

function recommendationsSection(section) {
  return `<ol class="recommendation-list">${paragraphs(section.content)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ol>`;
}

function methodologyBadges(report) {
  const chips = [
    `<span class="method-badge method-badge--accent">${escapeHtml(report.standardLong)}</span>`,
    `<span class="method-badge">${escapeHtml(report.ghgProtocol)}</span>`,
    ...report.dataSources.map(
      (source) => `<span class="method-badge">${escapeHtml(source)}</span>`,
    ),
  ];

  return `<div class="method-badges">${chips.join("")}</div>`;
}

function metricsSection(report) {
  const unit = report.unit;
  const cards = report.breakdown
    .map(
      (item) => `
        <div class="metric-card">
          <div class="metric-label">${escapeHtml(item.label)}</div>
          <div class="metric-value">${formatEmissions(item.value, unit)}</div>
          <p>${formatPercent(item.percentage)}</p>
        </div>`,
    )
    .join("");

  return `
    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-label">Total emissions</div>
        <div class="metric-value">${formatEmissions(report.total.totalEmissions, unit)}</div>
      </div>
      ${cards}
    </div>`;
}

function breakdownSection(report) {
  return `
    <div class="report-chart">
      ${donutSvg({ breakdown: report.breakdown, total: report.total.totalEmissions, unit: report.unit })}
      ${breakdownLegendHtml({ breakdown: report.breakdown, unit: report.unit })}
    </div>`;
}

function entitySection(report) {
  const unit = report.unit;
  const colors = report.breakdown.map((item) => item.color);

  const columnHeaders = report.entityColumns
    .map((column) => `<th class="number">${escapeHtml(column.label)}</th>`)
    .join("");

  const rows = report.entities
    .map(
      (entity) => `
        <tr>
          <td>${escapeHtml(entity.name)}${
            report.showFunctionalUnit && entity.meta
              ? `<span class="entity-fu">${escapeHtml(entity.meta)}</span>`
              : ""
          }</td>
          ${report.entityColumns
            .map(
              (column) =>
                `<td class="number">${formatEmissions(entity.values[column.key], unit)}</td>`,
            )
            .join("")}
          <td class="number">${formatEmissions(entity.totalEmissions, unit)}</td>
        </tr>`,
    )
    .join("");

  return `
    <div class="stacked-bar-wrap">
      ${stackedBarSvg({ entities: report.entities, columns: report.entityColumns, colors, unit })}
    </div>
    <table class="report-table">
      <thead>
        <tr>
          <th>${escapeHtml(report.entityLabel)}${report.showFunctionalUnit ? " &amp; functional unit" : ""}</th>
          ${columnHeaders}
          <th class="number">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function topCategoriesSection(report) {
  if (report.topCategories.length === 0) {
    return `<p>${escapeHtml(report.topEmptyText)}</p>`;
  }

  const unit = report.unit;
  const maxCategoryValue = maxByValue(report.topCategories, "value");
  const categoryBars = report.topCategories
    .map(
      (category, index) => `
        <div class="bar-row">
          <div class="bar-row-header">
            <strong>${escapeHtml(category.label)}</strong>
            <span>${formatEmissions(category.value, unit)}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill category-fill" style="width: ${percentageOfMax(
              category.value,
              maxCategoryValue,
            )}%; background: ${category.color || SEQUENTIAL_COLORS[index % SEQUENTIAL_COLORS.length]}"></div>
          </div>
        </div>`,
    )
    .join("");

  return `<div class="bar-list">${categoryBars}</div>`;
}

function categorySection(report) {
  const unit = report.unit;
  const totalLabel = report.categoryTotalLabel || "Total";

  return report.categoryBreakdown
    .map(
      (group) => `
        <div class="category-group">
          <h3>${escapeHtml(group.group)} detailed categories</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>Category</th>
                <th class="number">${escapeHtml(totalLabel)}</th>
                ${group.categories[0].perEntity
                  .map(
                    (entity) =>
                      `<th class="number">${escapeHtml(shortEntityName(entity.name))}</th>`,
                  )
                  .join("")}
              </tr>
            </thead>
            <tbody>
              ${group.categories
                .map(
                  (category) => `
                    <tr>
                      <td>${escapeHtml(category.label)}</td>
                      <td class="number">${formatEmissions(category.total, unit)}</td>
                      ${category.perEntity
                        .map(
                          (entity) =>
                            `<td class="number">${formatEmissions(entity.value, unit)}</td>`,
                        )
                        .join("")}
                    </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </div>`,
    )
    .join("");
}

function sectionBody(section, report) {
  if (section.type === "metrics") {
    return `${sectionIntro(section)}${metricsSection(report)}`;
  }

  if (section.type === "chart") {
    return `${sectionIntro(section)}${breakdownSection(report)}`;
  }

  if (section.type === "table") {
    return `${sectionIntro(section)}${entitySection(report)}`;
  }

  if (section.type === "category-tables") {
    return `${sectionIntro(section)}${categorySection(report)}`;
  }

  if (section.type === "insights") {
    return `${insightsSection(section)}${topCategoriesSection(report)}`;
  }

  if (section.type === "narrative-analysis") {
    return narrativeAnalysisSection(section);
  }

  if (section.type === "recommendations") {
    return recommendationsSection(section);
  }

  if (section.id === "methodology") {
    return `${textSection(section)}${methodologyBadges(report)}`;
  }

  return textSection(section);
}

function sectionClassName(section) {
  return [
    "report-section",
    `report-section--${section.id}`,
    `report-section--${section.type}`,
    section.printMode ? `report-section--print-${section.printMode}` : "",
  ].join(" ");
}

function reportMarkup({ report, sections, settings }) {
  const clientName = settings?.clientName || report.clientName;
  const reportLabel = settings?.reportLabel || report.reportTitle;
  const brand = buildBrandTheme(settings);
  const reportYear = settings?.reportYear || "2024";
  const preparedBy = settings?.preparedBy || "Footprint Mappa";
  const preparedFor = settings?.preparedFor || "";
  const reportDate = settings?.reportDate || "";
  const reportingPeriod = settings?.reportingPeriod || "";
  const subtitle = settings?.subtitle || report.coverSubtitle;
  const totalSourceLabel = settings?.totalSourceLabel || report.totalSourceLabel;
  const notes = settings?.notes || "";
  const logoDataUrl = safeImageSrc(settings?.logoDataUrl);
  const visibleSections = enabledSections(sections);
  const eyebrowParts = [`Prepared by ${preparedBy}`];
  if (preparedFor) eyebrowParts.push(`Prepared for ${preparedFor}`);
  if (reportDate) eyebrowParts.push(reportDate);
  const renderedToc = visibleSections
    .map((section) => `<li>${escapeHtml(section.title)}</li>`)
    .join("");
  const renderedSections = visibleSections
    .map(
      (section) => `
        <section class="${sectionClassName(section)}">
          <h2>${escapeHtml(section.title)}</h2>
          ${sectionBody(section, report)}
        </section>`,
    )
    .join("");

  return `
    <article class="report-page" style="--report-accent: ${brand.accent}; --report-on-accent: ${brand.onAccent}">
      <header class="report-cover">
        <div class="cover-topline">
          ${
            logoDataUrl
              ? `<img class="cover-logo" src="${logoDataUrl}" alt="${escapeHtml(clientName)} logo" />`
              : `<div class="client-wordmark">${escapeHtml(clientName)}</div>`
          }
          <div class="report-badge">${escapeHtml(report.coverBadge)} ${escapeHtml(reportYear)}</div>
        </div>
        <div class="cover-main">
          <p class="report-eyebrow">${escapeHtml(eyebrowParts.join(" · "))}</p>
          <h1 class="report-title">${escapeHtml(reportLabel)}</h1>
          <p class="report-subtitle">${escapeHtml(subtitle)}</p>
          <div class="cover-headline">
            <strong>${formatEmissions(report.total.totalEmissions, report.unit)}</strong>
            <span>total footprint · ${escapeHtml(reportYear)}</span>
          </div>
          <div class="cover-standard">
            <span>${escapeHtml(report.standardLong)}</span>
            <span>${escapeHtml(report.ghgProtocol.includes("Product") ? "GHG Protocol · Product" : "GHG Protocol · Corporate")}</span>
          </div>
        </div>
        <div class="cover-summary">
          <div>
            <span>Client</span>
            <strong>${escapeHtml(clientName)}</strong>
          </div>
          <div>
            <span>Total emissions</span>
            <strong>${formatEmissions(report.total.totalEmissions, report.unit)}</strong>
          </div>
          <div>
            <span>${reportingPeriod ? "Reporting period" : "Source file"}</span>
            <strong>${escapeHtml(reportingPeriod || report.fileName)}</strong>
          </div>
          <div>
            <span>Total source</span>
            <strong>${escapeHtml(totalSourceLabel)}</strong>
          </div>
        </div>
        ${
          notes
            ? `<div class="cover-note"><span>Assumptions &amp; notes</span><p>${escapeHtml(notes)}</p></div>`
            : ""
        }
      </header>
      <nav class="report-toc" aria-label="Report sections">
        <h2>Included sections</h2>
        <ol>${renderedToc}</ol>
      </nav>
      ${renderedSections}
    </article>`;
}

const FONT_FILES = [
  ["BDOGrotesk-Regular.woff", 400],
  ["BDOGrotesk-Medium.woff", 500],
  ["BDOGrotesk-DemiBold.woff", 600],
  ["BDOGrotesk-Bold.woff", 700],
];

let fontFaceCssCache;

// Embed the brand font as base64 @font-face so the Playwright-rendered PDF uses
// BDO Grotesk even though page.setContent has no base URL to resolve /fonts.
function buildFontFaceCss() {
  if (fontFaceCssCache !== undefined) {
    return fontFaceCssCache;
  }

  try {
    fontFaceCssCache = FONT_FILES.map(([file, weight]) => {
      const base64 = readFileSync(
        join(process.cwd(), "public", "fonts", file),
      ).toString("base64");
      return `@font-face{font-family:"BDO Grotesk";font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff;base64,${base64}) format("woff");}`;
    }).join("");
  } catch {
    fontFaceCssCache = "";
  }

  return fontFaceCssCache;
}

export function renderHtmlReportDocument({ report, sections, settings }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(report.reportTitle)}</title>
    <style>${buildFontFaceCss()}</style>
    <style>${HTML_REPORT_STYLES}</style>
  </head>
  <body>${reportMarkup({ report, sections, settings })}</body>
</html>`;
}

export function renderPdfHeader({ report, settings }) {
  const clientName = settings?.clientName || report.clientName;
  const reportLabel = settings?.reportLabel || report.reportTitle;
  const reportYear = settings?.reportYear || "2024";
  const brand = buildBrandTheme(settings);

  return `
    <style>
      body { margin: 0; }
      .pdf-header {
        border-bottom: 1px solid #d4d4d8;
        color: #3f3f46;
        display: flex;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 9px;
        gap: 12px;
        justify-content: space-between;
        margin: 0 12mm;
        padding: 6px 0 4px;
        width: calc(100% - 24mm);
      }
      .pdf-header strong { color: #18181b; }
      .pdf-header__brand {
        align-items: center;
        display: flex;
        gap: 7px;
        min-width: 0;
      }
      .pdf-header__mark {
        background: ${brand.accent};
        border-radius: 999px;
        display: inline-block;
        height: 7px;
        width: 7px;
      }
      .pdf-header__title {
        overflow: hidden;
        text-align: right;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    </style>
    <div class="pdf-header">
      <span class="pdf-header__brand">
        <span class="pdf-header__mark"></span>
        <strong>${escapeHtml(clientName)}</strong>
      </span>
      <span class="pdf-header__title">${escapeHtml(reportLabel)} | ${escapeHtml(reportYear)}</span>
    </div>`;
}

export function renderPdfFooter({ settings } = {}) {
  const preparedBy = settings?.preparedBy || "Footprint Mappa";
  const brand = buildBrandTheme(settings);

  return `
    <style>
      body { margin: 0; }
      .pdf-footer {
        border-top: 1px solid #d4d4d8;
        color: #52525b;
        display: flex;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 9px;
        gap: 12px;
        justify-content: space-between;
        margin: 0 12mm;
        padding: 4px 0 6px;
        width: calc(100% - 24mm);
      }
      .pdf-footer strong { color: ${brand.accent}; }
    </style>
    <div class="pdf-footer">
      <span>Prepared by <strong>${escapeHtml(preparedBy)}</strong></span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>`;
}
