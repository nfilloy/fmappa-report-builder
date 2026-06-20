import { readFileSync } from "node:fs";
import { join } from "node:path";

import React from "react";

import { HtmlReport } from "@/components/report-html/HtmlReport";
import { buildBrandTheme } from "@/lib/report/brandTheme";
import { HTML_REPORT_STYLES } from "@/lib/report/htmlReportStyles";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

async function renderReportMarkup({ report, sections, settings }) {
  const { renderToStaticMarkup } = await import("react-dom/server");

  return renderToStaticMarkup(
    React.createElement(HtmlReport, {
      editable: false,
      report,
      sections,
      settings,
    }),
  );
}

export async function renderHtmlReportDocument({ report, sections, settings }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(settings?.reportLabel || report.reportTitle)}</title>
    <style>${buildFontFaceCss()}</style>
    <style>${HTML_REPORT_STYLES}</style>
  </head>
  <body>${await renderReportMarkup({ report, sections, settings })}</body>
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
