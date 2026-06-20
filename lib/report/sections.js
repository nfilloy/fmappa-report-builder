import { formatEmissions, formatPercent } from "../formatters.js";

const SECTION_DEFINITIONS_BY_KIND = {
  ocf: [
    { id: "executive-summary", title: "Executive summary", type: "narrative-analysis", editableContent: true, removable: false, printMode: "avoid" },
    { id: "introduction", title: "Introduction", type: "text", editableContent: true, removable: false, printMode: "flow" },
    { id: "methodology", title: "Methodological approach", type: "text", editableContent: true, removable: false, printMode: "flow" },
    { id: "organisational-boundary", title: "Scope and boundaries", type: "text", editableContent: true, removable: false, printMode: "flow" },
    { id: "scope-definitions", title: "Scope definitions", type: "text", editableContent: true, removable: false },
    { id: "global-results", title: "Global results", type: "metrics", editableContent: true, removable: false },
    { id: "scope-breakdown", title: "Scope breakdown", type: "chart", editableContent: true, removable: false },
    { id: "site-emissions", title: "Site emissions", type: "table", editableContent: true, removable: false },
    { id: "detailed-categories", title: "Detailed category breakdown", type: "category-tables", editableContent: true, removable: false },
    { id: "scope-analysis", title: "Scope-by-scope analysis", type: "narrative-analysis", editableContent: true, removable: false, printMode: "flow" },
    { id: "comparative-analysis", title: "Comparative analysis", type: "narrative-analysis", editableContent: true, removable: false, printMode: "flow" },
    { id: "key-insights", title: "Key insights", type: "insights", editableContent: true, removable: false },
    { id: "overall-conclusions", title: "Overall conclusions and outlook", type: "narrative-analysis", editableContent: true, removable: false, printMode: "flow" },
    { id: "strategic-recommendations", title: "Strategic recommendations", type: "recommendations", editableContent: true, removable: false, printMode: "flow" },
    { id: "limitations", title: "Limitations and next steps", type: "text", editableContent: true, removable: false },
  ],
  pcf: [
    { id: "executive-summary", title: "Executive summary", type: "narrative-analysis", editableContent: true, removable: false, printMode: "avoid" },
    { id: "introduction", title: "Introduction", type: "text", editableContent: true, removable: false, printMode: "flow" },
    { id: "methodology", title: "Methodological approach", type: "text", editableContent: true, removable: false },
    { id: "product-scope", title: "Product scope and boundaries", type: "text", editableContent: true, removable: false },
    { id: "functional-unit", title: "Functional unit", type: "text", editableContent: true, removable: false },
    { id: "global-results", title: "Global results", type: "metrics", editableContent: true, removable: false },
    { id: "lifecycle-breakdown", title: "Lifecycle stage breakdown", type: "chart", editableContent: true, removable: false },
    { id: "product-results", title: "Product results", type: "table", editableContent: true, removable: false },
    { id: "detailed-categories", title: "Detailed lifecycle breakdown", type: "category-tables", editableContent: true, removable: false },
    { id: "lifecycle-analysis", title: "Lifecycle and material analysis", type: "narrative-analysis", editableContent: true, removable: false, printMode: "flow" },
    { id: "key-insights", title: "Key insights", type: "insights", editableContent: true, removable: false },
    { id: "overall-conclusions", title: "Overall conclusions and outlook", type: "narrative-analysis", editableContent: true, removable: false, printMode: "flow" },
    { id: "strategic-recommendations", title: "Strategic recommendations", type: "recommendations", editableContent: true, removable: false, printMode: "flow" },
    { id: "limitations", title: "Limitations and next steps", type: "text", editableContent: true, removable: false },
  ],
};

const SECTION_PRESETS_BY_KIND = {
  ocf: {
    consulting: {
      label: "Consulting full report",
      sectionIds: [
        "executive-summary",
        "introduction",
        "methodology",
        "organisational-boundary",
        "scope-definitions",
        "global-results",
        "scope-breakdown",
        "site-emissions",
        "detailed-categories",
        "scope-analysis",
        "comparative-analysis",
        "key-insights",
        "overall-conclusions",
        "strategic-recommendations",
        "limitations",
      ],
    },
    full: {
      label: "Full report",
      sectionIds: [
        "executive-summary",
        "introduction",
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
    consulting: {
      label: "Consulting full report",
      sectionIds: [
        "executive-summary",
        "introduction",
        "methodology",
        "product-scope",
        "functional-unit",
        "global-results",
        "lifecycle-breakdown",
        "product-results",
        "detailed-categories",
        "lifecycle-analysis",
        "key-insights",
        "overall-conclusions",
        "strategic-recommendations",
        "limitations",
      ],
    },
    full: {
      label: "Full report",
      sectionIds: [
        "executive-summary",
        "introduction",
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
    "executive-summary": `${report.clientName}'s 2024 organisational carbon footprint amounts to ${formatEmissions(report.total.totalEmissions, unit)} across the reported boundary. ${dominantScope.label} is the dominant source of emissions, representing ${formatPercent(dominantScope.percentage)} of the total footprint, which indicates that reduction priorities should focus first on the most material value-chain and operational drivers.\nThe report combines a quantitative footprint summary with editable consulting narrative so the final PDF can include client context, methodological caveats, interpretation of changes and management recommendations that are not present in the uploaded CSV.`,
    introduction: `The present report summarises the results of the 2024 organisational carbon footprint assessment for ${report.clientName}. It provides a quantitative overview of emissions by scope, site and category, and creates a structured basis for management discussion, supplier engagement and future decarbonisation planning.\nThe assessment is generated from the uploaded dataset and should be completed with client-specific context where relevant, including organisational changes, production variations, exclusions, improvement actions and any comparison against previous reporting years.`,
    methodology: `This assessment follows the ${report.standardLong} methodology and the ${report.ghgProtocol}, two internationally recognised frameworks for quantifying and reporting greenhouse gas emissions. The organisational boundary is defined under the ${report.boundaryBasis} criterion.\nActivity data combine primary records with secondary emission factors from recognised databases (${report.dataSources.join(", ")}). The application validates the required schema, normalises company and site totals, groups emissions by Scope 1, Scope 2 and Scope 3, and renders the same configured report model in the browser preview and PDF export.\nBefore external publication, this section should be reviewed to document emission-factor versions, data-quality assumptions, exclusions and any methodological change versus the prior reporting year.`,
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
    "scope-analysis": [
      `Scope 1 represents direct emissions from sources owned or controlled by the company. In the uploaded dataset, Scope 1 contributes ${formatEmissions(report.breakdown[0]?.value, unit)} (${formatPercent(report.breakdown[0]?.percentage)}), so it should be interpreted in relation to on-site fuel use, mobile combustion, process emissions and refrigerant losses.`,
      `Scope 2 represents purchased electricity, heat or steam. The reported Scope 2 contribution is ${formatEmissions(report.breakdown[1]?.value, unit)} (${formatPercent(report.breakdown[1]?.percentage)}). This section should be completed with electricity sourcing, market/location based assumptions and renewable-energy evidence where available.`,
      `Scope 3 represents the wider value chain and contributes ${formatEmissions(report.breakdown[2]?.value, unit)} (${formatPercent(report.breakdown[2]?.percentage)}). The largest recognised Scope 3 hotspot is ${topCategory ? `${topCategory.label} at ${formatEmissions(topCategory.value, unit)}` : "not available from the dataset"}, making supplier, material, logistics and end-of-life analysis central to the reduction roadmap.`,
    ].join("\n"),
    "comparative-analysis":
      "Use this editable section to document year-on-year performance when a baseline is available. Include total emissions, scope-level changes, perimeter changes, production or revenue intensity indicators, and methodological changes that may affect comparability. If no baseline is available, state that the current year should be treated as the baseline for future comparison.",
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
    "overall-conclusions": `The results confirm that ${report.clientName}'s footprint is primarily driven by ${dominantScope.label.toLowerCase()}, with ${dominantSite ? dominantSite.name : "the reported perimeter"} acting as an important operational reference point. The final interpretation should connect these results to business activity, procurement patterns, site operations and any changes in organisational perimeter.\nThe configured report provides a robust basis for internal review, but publication should include a final methodological review, evidence checks and management sign-off on reduction priorities.`,
    "strategic-recommendations": [
      "Prioritise the largest material categories and supplier groups for primary-data improvement and lower-carbon sourcing.",
      "Expand renewable electricity procurement or on-site generation where Scope 2 or electricity-linked Scope 3 categories are material.",
      "Strengthen site-level data ownership so future reporting cycles can compare performance consistently year over year.",
      "Develop a reduction roadmap that separates quick operational actions from longer-term product, material and supplier changes.",
    ].join("\n"),
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
    "executive-summary": `${report.clientName}'s 2024 product carbon footprint covers ${report.entities.length} products with a combined footprint of ${formatEmissions(report.total.totalEmissions, unit)}. The ${dominantStage.label} stage is the dominant contributor, representing ${formatPercent(dominantStage.percentage)} of total lifecycle emissions, which points to where product-level reduction efforts are likely to be most effective.\nThe report combines calculated lifecycle results with editable consulting narrative for product families, manufacturing sites, benchmarks, scenario commentary and recommendations that are not available in the minimum CSV schema.`,
    introduction: `The present report summarises the product carbon footprint assessment for the products listed in the uploaded dataset. It provides a quantitative overview of lifecycle-stage emissions and a structured base for product design, sourcing, manufacturing and logistics decisions.\nClient-specific context should be added where relevant, including product families, production sites, part-number groupings, functional-unit rationale, customer requirements and whether the study is intended as a baseline for future product comparisons.`,
    methodology: `This assessment follows the ${report.standardLong} methodology and the ${report.ghgProtocol}. The system boundary covers the product life cycle stages declared in the dataset (materials, manufacturing, transport, distribution, use and end-of-life).\nActivity data combine primary records with secondary life-cycle inventory factors from recognised databases (${report.dataSources.join(", ")}). The application validates the required schema, normalises per-product totals, groups emissions by lifecycle stage and renders the same configured report model in the browser preview and PDF export.\nBefore external publication, this section should document allocation rules, emission-factor versions, transport assumptions, manufacturing energy assumptions and any excluded lifecycle stages.`,
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
    "lifecycle-analysis": [
      `The ${dominantStage.label} stage is the largest lifecycle contributor with ${formatEmissions(dominantStage.value, unit)} (${formatPercent(dominantStage.percentage)}). This section should explain which materials, processes or logistics assumptions drive that result.`,
      dominantProduct
        ? `${dominantProduct.name} is the highest-impact product at ${formatEmissions(dominantProduct.totalEmissions, unit)}. Product-level interpretation should consider functional unit, material composition, manufacturing site and transport route before ranking improvement options.`
        : "No product rows were available for product-level interpretation.",
      functionalUnit
        ? `The declared functional unit (${functionalUnit}) should be used consistently when comparing variants, sites or product families.`
        : "The functional-unit basis should be reviewed before comparing product variants or aggregating portfolio results.",
    ].join("\n"),
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
    "overall-conclusions": `The product footprint is mainly shaped by ${dominantStage.label.toLowerCase()}, which should guide the first wave of reduction analysis. The final report should connect this hotspot to concrete product-family drivers such as material composition, supplier geography, manufacturing energy and transport routes.\nThe configured PDF is suitable as a structured reporting base, but client-specific scenario commentary and evidence checks should be completed before external publication.`,
    "strategic-recommendations": [
      "Focus material substitution and supplier engagement on the highest-emission lifecycle categories.",
      "Review renewable electricity and process-efficiency options at manufacturing sites where manufacturing emissions are material.",
      "Assess localised or lower-carbon logistics options for products with meaningful transport contributions.",
      "Build product-family baselines so future design changes can be compared against a consistent functional unit.",
    ].join("\n"),
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
