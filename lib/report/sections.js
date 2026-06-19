import { formatPercent, formatTonnes } from "../formatters.js";

const SECTION_DEFINITIONS = [
  { id: "executive-summary", title: "Executive summary", type: "text", editableContent: true, removable: false },
  { id: "methodology", title: "Methodology", type: "text", editableContent: true, removable: false },
  { id: "organisational-boundary", title: "Organisational boundary", type: "text", editableContent: true, removable: false },
  { id: "global-results", title: "Global results", type: "metrics", editableContent: true, removable: false },
  { id: "scope-breakdown", title: "Scope breakdown", type: "chart", editableContent: true, removable: false },
  { id: "site-emissions", title: "Site emissions", type: "table", editableContent: true, removable: false },
  { id: "detailed-categories", title: "Detailed category breakdown", type: "category-tables", editableContent: true, removable: false },
  { id: "key-insights", title: "Key insights", type: "insights", editableContent: true, removable: false },
  { id: "limitations", title: "Limitations and next steps", type: "text", editableContent: true, removable: false },
];

export const SECTION_PRESETS = {
  full: {
    label: "Full report",
    sectionIds: [
      "executive-summary",
      "methodology",
      "organisational-boundary",
      "global-results",
      "scope-breakdown",
      "site-emissions",
      "detailed-categories",
      "key-insights",
      "limitations",
    ],
  },
  executive: {
    label: "Executive brief",
    sectionIds: [
      "executive-summary",
      "global-results",
      "scope-breakdown",
      "key-insights",
    ],
  },
  compliance: {
    label: "Compliance",
    sectionIds: [
      "methodology",
      "organisational-boundary",
      "global-results",
      "site-emissions",
      "detailed-categories",
      "limitations",
    ],
  },
};

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
    "executive-summary": `${report.clientName}'s 2024 organisational carbon footprint amounts to ${formatTonnes(report.total.totalEmissions)} across the reported boundary. ${dominantScope.label} is the dominant source of emissions, representing ${formatPercent(dominantScope.percentage)} of the total footprint, which indicates that reduction priorities should be focused where the underlying activity data shows the highest materiality.`,
    methodology:
      "This report is prepared from the uploaded OCF dataset as an already-calculated emissions inventory. The application validates the required schema, normalises company and site totals, groups emissions by Scope 1, Scope 2 and Scope 3 categories, and renders the same configured report model in the browser preview and PDF export.",
    "organisational-boundary":
      report.totalSource === "official"
        ? "The organisational boundary follows the entities listed in the uploaded CSV. The Total empresa row is treated as the official consolidated company result, while the plant rows are used to explain the contribution of each site to the overall footprint."
        : "The organisational boundary follows the entities listed in the uploaded CSV. Because no Total empresa row was provided, the consolidated company result is calculated from the available site rows and should be reviewed before external publication.",
    "global-results":
      "The headline indicators below summarise the consolidated footprint and the relative contribution of each emissions scope.",
    "scope-breakdown":
      "The scope distribution helps identify whether the footprint is mainly driven by direct operations, purchased energy or wider value-chain activity.",
    "site-emissions":
      "The site view shows how emissions are distributed across the reported plants and supports prioritisation by operational perimeter.",
    "detailed-categories":
      "The category tables provide the most granular view available in the uploaded dataset and help trace the sources behind each scope total.",
    "key-insights": [
      `${dominantScope.label} is the largest emissions scope, representing ${formatPercent(dominantScope.percentage)} of total emissions and setting the main direction for reduction work.`,
      dominantSite
        ? `${dominantSite.entity} is the largest site contributor with ${formatTonnes(dominantSite.totalEmissions)}, making it a priority location for operational follow-up.`
        : "No site rows were available in the uploaded CSV.",
      topCategory
        ? `${topCategory.label} is the largest Scope 3 category with ${formatTonnes(topCategory.value)}, indicating where supplier, material or logistics analysis may be most valuable.`
        : "No recognised Scope 3 category values were available.",
    ].join("\n"),
    limitations:
      "This configurable report presents the calculated footprint from the uploaded dataset; it does not recalculate emission factors or audit the underlying activity data. Recommended next steps include validating source data quality, strengthening Relats-specific branding, adding charts for decision-making and moving the PDF pipeline toward production-grade pagination.",
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

export function createCustomSection(index = 0) {
  return {
    id: `custom-${Date.now()}-${index}`,
    title: "Custom section",
    type: "text",
    editableContent: true,
    removable: true,
    enabled: true,
    content: "",
  };
}

export function removeSection(sections, sectionId) {
  return sections.filter(
    (section) => !(section.id === sectionId && section.removable),
  );
}

export function applyPreset(sections, presetId) {
  const preset = SECTION_PRESETS[presetId];

  if (!preset) {
    return sections;
  }

  const byId = new Map(sections.map((section) => [section.id, section]));
  const orderedBaseSections = preset.sectionIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((section) => ({ ...section, enabled: true }));

  const orderedIds = new Set(preset.sectionIds);
  const disabledBaseSections = sections
    .filter((section) => !section.removable && !orderedIds.has(section.id))
    .map((section) => ({ ...section, enabled: false }));

  const customSections = sections.filter((section) => section.removable);

  return [...orderedBaseSections, ...disabledBaseSections, ...customSections];
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

export function updateSection(sections, sectionId, updates) {
  return sections.map((section) =>
    section.id === sectionId ? { ...section, ...updates } : section,
  );
}
