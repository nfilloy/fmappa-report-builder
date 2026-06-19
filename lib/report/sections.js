import { formatPercent, formatTonnes } from "../formatters.js";

const SECTION_DEFINITIONS = [
  { id: "executive-summary", title: "Executive summary", type: "text" },
  { id: "methodology", title: "Methodology", type: "text" },
  { id: "organisational-boundary", title: "Organisational boundary", type: "text" },
  { id: "global-results", title: "Global results", type: "metrics" },
  { id: "scope-breakdown", title: "Scope breakdown", type: "chart" },
  { id: "site-emissions", title: "Site emissions", type: "table" },
  { id: "detailed-categories", title: "Detailed category breakdown", type: "category-tables" },
  { id: "key-insights", title: "Key insights", type: "insights" },
  { id: "limitations", title: "Limitations and next steps", type: "text" },
];

function largestScope(report) {
  return [...report.scopeBreakdown].sort((a, b) => b.value - a.value)[0];
}

function largestSite(report) {
  return [...report.sites].sort((a, b) => b.totalEmissions - a.totalEmissions)[0];
}

function defaultContentById(id, report) {
  const dominantScope = largestScope(report);
  const dominantSite = largestSite(report);
  const topCategory = report.topScope3Categories[0];

  const content = {
    "executive-summary": `${report.clientName} reports ${formatTonnes(report.total.totalEmissions)} across its organisational carbon footprint. ${dominantScope.label} is the main contributor with ${formatPercent(dominantScope.percentage)} of the total footprint.`,
    methodology:
      "The report uses the uploaded OCF CSV as an already-calculated emissions dataset. The application validates the minimum schema, normalises totals and categories, and renders the same report model in the preview and PDF export.",
    "organisational-boundary":
      report.totalSource === "official"
        ? "The organisational boundary is based on the entities listed in the CSV. The Total empresa row is treated as the official company-level result."
        : "The organisational boundary is based on the entities listed in the CSV. No Total empresa row was provided, so company-level results are calculated from the site rows.",
    "global-results": "",
    "scope-breakdown": "",
    "site-emissions": "",
    "detailed-categories": "",
    "key-insights": [
      `${dominantScope.label} is the largest emissions scope, representing ${formatPercent(dominantScope.percentage)} of total emissions.`,
      dominantSite
        ? `${dominantSite.entity} is the largest site contributor with ${formatTonnes(dominantSite.totalEmissions)}.`
        : "No site rows were available in the uploaded CSV.",
      topCategory
        ? `${topCategory.label} is the largest Scope 3 category with ${formatTonnes(topCategory.value)}.`
        : "No recognised Scope 3 category values were available.",
    ].join("\n"),
    limitations:
      "This MVP does not calculate emission factors, store uploaded files, manage versioning, or reproduce the full consulting-grade Word report. Next steps include stronger validation, Relats-specific branding, charting, AI-assisted text editing, and production-grade PDF generation.",
  };

  return content[id] ?? "";
}

export function buildReportSections(report) {
  return SECTION_DEFINITIONS.map((section) => ({
    ...section,
    enabled: true,
    content: defaultContentById(section.id, report),
  }));
}

export function enabledSections(sections) {
  return sections.filter((section) => section.enabled);
}

export function reorderSection(sections, sectionId, direction) {
  const index = sections.findIndex((section) => section.id === sectionId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (index < 0 || targetIndex < 0 || targetIndex >= sections.length) {
    return sections;
  }

  const nextSections = [...sections];
  const [section] = nextSections.splice(index, 1);
  nextSections.splice(targetIndex, 0, section);
  return nextSections;
}
