import { formatPercent, formatTonnes } from "@/lib/formatters";
import { HTML_REPORT_STYLES } from "@/lib/report/htmlReportStyles";
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
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#0891b2";
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
  return `
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

function categorySection(report) {
  return report.categoryBreakdown
    .map(
      (group) => `
        <div class="report-section">
          <h2>${escapeHtml(group.scope)} detailed categories</h2>
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
    return metricsSection(report);
  }

  if (section.type === "chart") {
    return scopeSection(report);
  }

  if (section.type === "table") {
    return siteSection(report);
  }

  if (section.type === "category-tables") {
    return categorySection(report);
  }

  if (section.type === "insights") {
    return insightsSection(section);
  }

  return textSection(section);
}

function reportMarkup({ report, sections, settings }) {
  const clientName = settings?.clientName || report.clientName;
  const reportLabel = settings?.reportLabel || "Configurable OCF report";
  const accentColor = safeColor(settings?.accentColor);
  const renderedSections = enabledSections(sections)
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
        <div class="report-eyebrow">Footprint Mappa · ${escapeHtml(reportLabel)}</div>
        <h1 class="report-title">${escapeHtml(report.reportTitle)}</h1>
        <div class="report-meta">
          <div>Client: ${escapeHtml(clientName)}</div>
          <div>Source file: ${escapeHtml(report.fileName)}</div>
          <div>Total source: ${
            report.totalSource === "official"
              ? "Official Total empresa row"
              : "Calculated from site rows"
          }</div>
        </div>
      </header>
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
