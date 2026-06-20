import { formatEmissions, formatPercent } from "../formatters.js";

const SECTION_DEFINITIONS_BY_KIND = {
  ocf: [
    { id: "executive-summary", title: "Executive summary", type: "text", editableContent: true, removable: false },
    { id: "methodology", title: "Methodology", type: "text", editableContent: true, removable: false },
    { id: "organisational-boundary", title: "Organisational boundary", type: "text", editableContent: true, removable: false },
    { id: "scope-definitions", title: "Scope definitions", type: "text", editableContent: true, removable: false },
    { id: "global-results", title: "Global results", type: "metrics", editableContent: true, removable: false },
    { id: "scope-breakdown", title: "Scope breakdown", type: "chart", editableContent: true, removable: false },
    { id: "site-emissions", title: "Site emissions", type: "table", editableContent: true, removable: false },
    { id: "detailed-categories", title: "Detailed category breakdown", type: "category-tables", editableContent: true, removable: false },
    { id: "key-insights", title: "Key insights", type: "insights", editableContent: true, removable: false },
    { id: "limitations", title: "Limitations and next steps", type: "text", editableContent: true, removable: false },
  ],
  pcf: [
    { id: "executive-summary", title: "Executive summary", type: "text", editableContent: true, removable: false },
    { id: "methodology", title: "Methodology", type: "text", editableContent: true, removable: false },
    { id: "product-scope", title: "Product scope", type: "text", editableContent: true, removable: false },
    { id: "functional-unit", title: "Functional unit", type: "text", editableContent: true, removable: false },
    { id: "global-results", title: "Global results", type: "metrics", editableContent: true, removable: false },
    { id: "lifecycle-breakdown", title: "Lifecycle stage breakdown", type: "chart", editableContent: true, removable: false },
    { id: "product-results", title: "Product results", type: "table", editableContent: true, removable: false },
    { id: "detailed-categories", title: "Detailed lifecycle breakdown", type: "category-tables", editableContent: true, removable: false },
    { id: "key-insights", title: "Key insights", type: "insights", editableContent: true, removable: false },
    { id: "limitations", title: "Limitations and next steps", type: "text", editableContent: true, removable: false },
  ],
};

const SECTION_PRESETS_BY_KIND = {
  ocf: {
    full: {
      label: "Full report",
      sectionIds: [
        "executive-summary",
        "methodology",
        "organisational-boundary",
        "scope-definitions",
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
      sectionIds: ["executive-summary", "global-results", "scope-breakdown", "key-insights"],
    },
    compliance: {
      label: "Compliance",
      sectionIds: [
        "methodology",
        "organisational-boundary",
        "scope-definitions",
        "global-results",
        "site-emissions",
        "detailed-categories",
        "limitations",
      ],
    },
  },
  pcf: {
    full: {
      label: "Full report",
      sectionIds: [
        "executive-summary",
        "methodology",
        "product-scope",
        "functional-unit",
        "global-results",
        "lifecycle-breakdown",
        "product-results",
        "detailed-categories",
        "key-insights",
        "limitations",
      ],
    },
    executive: {
      label: "Executive brief",
      sectionIds: ["executive-summary", "global-results", "lifecycle-breakdown", "key-insights"],
    },
    compliance: {
      label: "Compliance",
      sectionIds: [
        "methodology",
        "product-scope",
        "functional-unit",
        "global-results",
        "product-results",
        "detailed-categories",
        "limitations",
      ],
    },
  },
};

function reportKind(report) {
  return report?.kind === "pcf" ? "pcf" : "ocf";
}

export function getSectionPresets(kind) {
  return SECTION_PRESETS_BY_KIND[kind === "pcf" ? "pcf" : "ocf"];
}

function largestBreakdown(report) {
  return [...report.breakdown].sort((a, b) => b.value - a.value)[0];
}

function largestEntity(report) {
  return [...report.entities].sort((a, b) => b.totalEmissions - a.totalEmissions)[0];
}

function ocfContentById(id, report) {
  const dominantScope = largestBreakdown(report);
  const dominantSite = largestEntity(report);
  const topCategory = report.topCategories[0];
  const unit = report.unit;

  const content = {
    "executive-summary": `${report.clientName}'s 2024 organisational carbon footprint amounts to ${formatEmissions(report.total.totalEmissions, unit)} across the reported boundary. ${dominantScope.label} is the dominant source of emissions, representing ${formatPercent(dominantScope.percentage)} of the total footprint, which indicates that reduction priorities should be focused where the underlying activity data shows the highest materiality.`,
    methodology: `This assessment follows the ${report.standardLong} methodology and the ${report.ghgProtocol}, two internationally recognised frameworks for quantifying and reporting greenhouse gas emissions. The organisational boundary is defined under the ${report.boundaryBasis} criterion. Activity data combine primary records with secondary emission factors from recognised databases (${report.dataSources.join(", ")}). The application validates the required schema, normalises company and site totals, groups emissions by Scope 1, Scope 2 and Scope 3, and renders the same configured report model in the browser preview and PDF export.`,
    "organisational-boundary":
      report.totalSource === "official"
        ? "The organisational boundary follows the entities listed in the uploaded CSV. The Total empresa row is treated as the official consolidated company result, while the plant rows are used to explain the contribution of each site to the overall footprint."
        : "The organisational boundary follows the entities listed in the uploaded CSV. Because no Total empresa row was provided, the consolidated company result is calculated from the available site rows and should be reviewed before external publication.",
    "scope-definitions": [
      "Scope 1 — direct emissions from sources owned or controlled by the company, such as fuel combustion in equipment and company vehicles.",
      "Scope 2 — indirect emissions from the generation of purchased electricity, heat or steam consumed by the company.",
      "Scope 3 — all other indirect emissions across the value chain, both upstream and downstream, including purchased goods and services, transport, waste, business travel and the use and end-of-life of sold products.",
    ].join("\n"),
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
        ? `${dominantSite.name} is the largest site contributor with ${formatEmissions(dominantSite.totalEmissions, unit)}, making it a priority location for operational follow-up.`
        : "No site rows were available in the uploaded CSV.",
      topCategory
        ? `${topCategory.label} is the largest Scope 3 category with ${formatEmissions(topCategory.value, unit)}, indicating where supplier, material or logistics analysis may be most valuable.`
        : "No recognised Scope 3 category values were available.",
    ].join("\n"),
    limitations:
      "This configurable report presents the calculated footprint from the uploaded dataset; it does not recalculate emission factors or audit the underlying activity data. Recommended next steps include validating source data quality, strengthening Relats-specific branding, adding charts for decision-making and moving the PDF pipeline toward production-grade pagination.",
  };

  return content[id] ?? "";
}

function pcfContentById(id, report) {
  const dominantStage = largestBreakdown(report);
  const dominantProduct = largestEntity(report);
  const topCategory = report.topCategories[0];
  const unit = report.unit;
  const functionalUnit = report.entities.find((entity) => entity.meta)?.meta;

  const content = {
    "executive-summary": `${report.clientName}'s 2024 product carbon footprint covers ${report.entities.length} products with a combined footprint of ${formatEmissions(report.total.totalEmissions, unit)}. The ${dominantStage.label} stage is the dominant contributor, representing ${formatPercent(dominantStage.percentage)} of total lifecycle emissions, which points to where product-level reduction efforts are likely to be most effective.`,
    methodology: `This assessment follows the ${report.standardLong} methodology and the ${report.ghgProtocol}. The system boundary covers the product life cycle stages declared in the dataset (materials, manufacturing, transport, distribution, use and end-of-life). Activity data combine primary records with secondary life-cycle inventory factors from recognised databases (${report.dataSources.join(", ")}). The application validates the required schema, normalises per-product totals, groups emissions by lifecycle stage and renders the same configured report model in the browser preview and PDF export.`,
    "product-scope":
      "The product scope follows the products listed in the uploaded CSV. Each row represents a product whose lifecycle emissions are reported per functional unit, allowing comparison of relative impact across the assessed portfolio.",
    "functional-unit": functionalUnit
      ? `Results are expressed per functional unit as declared in the dataset (e.g. "${functionalUnit}"). The functional unit defines the reference flow against which all lifecycle-stage emissions are quantified and ensures comparability between products. Per-product functional units are shown alongside each product in the results table.`
      : "Results are expressed per functional unit as declared in the dataset. The functional unit defines the reference flow against which all lifecycle-stage emissions are quantified and should be reviewed to ensure comparability between products.",
    "global-results":
      "The headline indicators below summarise the aggregated product footprint and the relative contribution of each lifecycle stage.",
    "lifecycle-breakdown":
      "The lifecycle distribution helps identify whether emissions are mainly driven by raw materials, manufacturing, logistics or the product use and end-of-life phases.",
    "product-results":
      "The product view shows how emissions are distributed across the assessed products and supports prioritisation of redesign or sourcing decisions.",
    "detailed-categories":
      "The lifecycle tables provide the most granular view available in the uploaded dataset and help trace the sources behind each stage total.",
    "key-insights": [
      `The ${dominantStage.label} stage is the largest lifecycle contributor, representing ${formatPercent(dominantStage.percentage)} of total emissions and setting the main direction for product improvement work.`,
      dominantProduct
        ? `${dominantProduct.name} is the highest-impact product with ${formatEmissions(dominantProduct.totalEmissions, unit)}, making it a priority for design and sourcing review.`
        : "No product rows were available in the uploaded CSV.",
      topCategory
        ? `${topCategory.label} is the largest lifecycle category with ${formatEmissions(topCategory.value, unit)}, indicating where material, process or logistics analysis may be most valuable.`
        : "No recognised lifecycle category values were available.",
    ].join("\n"),
    limitations:
      "This configurable report presents the calculated footprint from the uploaded dataset; it does not recalculate emission factors or audit the underlying activity data. Aggregated totals assume comparable functional units across products. Recommended next steps include validating source data quality, strengthening Relats-specific branding and moving the PDF pipeline toward production-grade pagination.",
  };

  return content[id] ?? "";
}

function defaultContentById(id, report) {
  return reportKind(report) === "pcf"
    ? pcfContentById(id, report)
    : ocfContentById(id, report);
}

export function buildReportSections(report) {
  const definitions = SECTION_DEFINITIONS_BY_KIND[reportKind(report)];

  return definitions.map((section) => ({
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

export function applyPreset(sections, presetId, kind = "ocf") {
  const preset = getSectionPresets(kind)[presetId];

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
