import { formatPercent, formatTonnes } from "@/lib/formatters";
import { HTML_REPORT_STYLES } from "@/lib/report/htmlReportStyles";
import { maxByValue, percentageOfMax } from "@/lib/report/chartData";
import { enabledSections } from "@/lib/report/sections";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeColor(value) {
  const color = String(value ?? "");
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#b91c1c";
}

function safeImageSrc(value) {
  const src = String(value ?? "");
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=\s]+$/.test(src)
    ? src
    : "";
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

function metricsSection(report) {
  const scopeCards = report.scopeBreakdown
    .map(
      (scope) => `
        <div class="metric-card">
          <div class="metric-label">${escapeHtml(scope.label)}</div>
          <div class="metric-value">${formatTonnes(scope.value)}</div>
          <p>${formatPercent(scope.percentage)}</p>
        </div>`,
    )
    .join("");

  return `
    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-label">Total emissions</div>
        <div class="metric-value">${formatTonnes(report.total.totalEmissions)}</div>
      </div>
      ${scopeCards}
    </div>`;
}

function scopeSection(report) {
  return report.scopeBreakdown
    .map(
      (scope) => `
        <div class="scope-row">
          <div class="scope-row-header">
            <strong>${escapeHtml(scope.label)}</strong>
            <span>${formatTonnes(scope.value)} · ${formatPercent(scope.percentage)}</span>
          </div>
          <div class="scope-track">
            <div class="scope-fill" style="width: ${Math.min(scope.percentage, 100)}%"></div>
          </div>
        </div>`,
    )
    .join("");
}

function siteSection(report) {
  const maxEmissions = maxByValue(report.sites, "totalEmissions");
  const siteBars = report.sites
    .map(
      (site) => `
        <div class="bar-row">
          <div class="bar-row-header">
            <strong>${escapeHtml(site.entity)}</strong>
            <span>${formatTonnes(site.totalEmissions)}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill site-fill" style="width: ${percentageOfMax(
              site.totalEmissions,
              maxEmissions,
            )}%"></div>
          </div>
        </div>`,
    )
    .join("");

  return `
    <div class="bar-list">${siteBars}</div>
    <table class="report-table">
      <thead>
        <tr>
          <th>Entity</th>
          <th class="number">Scope 1</th>
          <th class="number">Scope 2</th>
          <th class="number">Scope 3</th>
          <th class="number">Total</th>
        </tr>
      </thead>
      <tbody>
        ${report.sites
          .map(
            (site) => `
              <tr>
                <td>${escapeHtml(site.entity)}</td>
                <td class="number">${formatTonnes(site.scope1)}</td>
                <td class="number">${formatTonnes(site.scope2)}</td>
                <td class="number">${formatTonnes(site.scope3)}</td>
                <td class="number">${formatTonnes(site.totalEmissions)}</td>
              </tr>`,
          )
          .join("")}
      </tbody>
    </table>`;
}

function topScope3Section(report) {
  if (report.topScope3Categories.length === 0) {
    return "<p>No recognised Scope 3 category values were available.</p>";
  }

  const maxCategoryValue = maxByValue(report.topScope3Categories, "value");
  const categoryBars = report.topScope3Categories
    .map(
      (category) => `
        <div class="bar-row">
          <div class="bar-row-header">
            <strong>${escapeHtml(category.label)}</strong>
            <span>${formatTonnes(category.value)}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill category-fill" style="width: ${percentageOfMax(
              category.value,
              maxCategoryValue,
            )}%"></div>
          </div>
        </div>`,
    )
    .join("");

  return `<div class="bar-list">${categoryBars}</div>`;
}

function categorySection(report) {
  return report.categoryBreakdown
    .map(
      (group) => `
        <div class="category-group">
          <h3>${escapeHtml(group.scope)} detailed categories</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>Category</th>
                <th class="number">Total empresa</th>
                ${report.sites
                  .map(
                    (site) =>
                      `<th class="number">${escapeHtml(site.entity.replace("Planta ", ""))}</th>`,
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
                      <td class="number">${formatTonnes(category.total)}</td>
                      ${category.sites
                        .map(
                          (site) =>
                            `<td class="number">${formatTonnes(site.value)}</td>`,
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
    return `${sectionIntro(section)}${scopeSection(report)}`;
  }

  if (section.type === "table") {
    return `${sectionIntro(section)}${siteSection(report)}`;
  }

  if (section.type === "category-tables") {
    return `${sectionIntro(section)}${categorySection(report)}`;
  }

  if (section.type === "insights") {
    return `${insightsSection(section)}${topScope3Section(report)}`;
  }

  return textSection(section);
}

function reportMarkup({ report, sections, settings }) {
  const clientName = settings?.clientName || report.clientName;
  const reportLabel =
    settings?.reportLabel || "Organisational Carbon Footprint Report 2024";
  const accentColor = safeColor(settings?.accentColor);
  const reportYear = settings?.reportYear || "2024";
  const preparedBy = settings?.preparedBy || "Footprint Mappa";
  const reportingPeriod = settings?.reportingPeriod || "";
  const notes = settings?.notes || "";
  const logoDataUrl = safeImageSrc(settings?.logoDataUrl);
  const totalSource =
    report.totalSource === "official"
      ? "Official Total empresa row"
      : "Calculated from site rows";
  const visibleSections = enabledSections(sections);
  const renderedToc = visibleSections
    .map((section) => `<li>${escapeHtml(section.title)}</li>`)
    .join("");
  const renderedSections = visibleSections
    .map(
      (section) => `
        <section class="report-section">
          <h2>${escapeHtml(section.title)}</h2>
          ${sectionBody(section, report)}
        </section>`,
    )
    .join("");

  return `
    <article class="report-page" style="--report-accent: ${accentColor}">
      <header class="report-cover">
        <div class="cover-topline">
          ${
            logoDataUrl
              ? `<img class="cover-logo" src="${logoDataUrl}" alt="${escapeHtml(clientName)} logo" />`
              : `<div class="client-wordmark">${escapeHtml(clientName)}</div>`
          }
          <div class="report-badge">OCF ${escapeHtml(reportYear)}</div>
        </div>
        <div class="cover-main">
          <p class="report-eyebrow">Prepared by ${escapeHtml(preparedBy)}</p>
          <h1 class="report-title">${escapeHtml(reportLabel)}</h1>
          <p class="report-subtitle">
            Configurable Scope 1, Scope 2 and Scope 3 emissions report generated from the uploaded OCF dataset.
          </p>
        </div>
        <div class="cover-summary">
          <div>
            <span>Client</span>
            <strong>${escapeHtml(clientName)}</strong>
          </div>
          <div>
            <span>Total emissions</span>
            <strong>${formatTonnes(report.total.totalEmissions)}</strong>
          </div>
          <div>
            <span>${reportingPeriod ? "Reporting period" : "Source file"}</span>
            <strong>${escapeHtml(reportingPeriod || report.fileName)}</strong>
          </div>
          <div>
            <span>Total source</span>
            <strong>${escapeHtml(totalSource)}</strong>
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

export function renderHtmlReportDocument({ report, sections, settings }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(report.reportTitle)}</title>
    <style>${HTML_REPORT_STYLES}</style>
  </head>
  <body>${reportMarkup({ report, sections, settings })}</body>
</html>`;
}

export function renderPdfHeader({ report, settings }) {
  const clientName = settings?.clientName || report.clientName;

  return `
    <style>
      body { margin: 0; }
      .pdf-header {
        border-bottom: 1px solid #d4d4d8;
        color: #3f3f46;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 9px;
        margin: 0 12mm;
        padding: 6px 0 4px;
        width: calc(100% - 24mm);
      }
      .pdf-header strong { color: #18181b; }
    </style>
    <div class="pdf-header">
      <strong>${escapeHtml(clientName)}</strong> | Organisational Carbon Footprint Report 2024
    </div>`;
}

export function renderPdfFooter() {
  return `
    <style>
      body { margin: 0; }
      .pdf-footer {
        border-top: 1px solid #d4d4d8;
        color: #52525b;
        display: flex;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 9px;
        justify-content: space-between;
        margin: 0 12mm;
        padding: 4px 0 6px;
        width: calc(100% - 24mm);
      }
    </style>
    <div class="pdf-footer">
      <span>Prepared by Footprint Mappa</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>`;
}
