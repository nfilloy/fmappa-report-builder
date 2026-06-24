import { formatEmissions, formatPercent } from "../formatters.js";

// Single source of truth for the reporting year default. The live year flows in
// from `settings.reportYear`; this is only the fallback used when no metadata is
// threaded (e.g. tests calling `buildReportSections(report)` directly).
export const DEFAULT_REPORT_YEAR = "2024";

const REPORT_TITLE_BY_KIND = {
  ocf: (year) => `Organisational Carbon Footprint Report ${year}`,
  pcf: (year) => `Products Carbon Footprint Report ${year}`,
};

// Report title derived from kind + year so the title, cover and page chrome all
// track the configured reporting year instead of a frozen "…Report 2024" string.
export function buildReportTitle(kind, year = DEFAULT_REPORT_YEAR) {
  const builder = REPORT_TITLE_BY_KIND[kind === "pcf" ? "pcf" : "ocf"];
  return builder(year || DEFAULT_REPORT_YEAR);
}

// Resolve the metadata that drives the generated copy. Client name, year and
// data sources fall back to the report defaults so the sample output is
// unchanged; `enabledIds` (when provided) lets cross-references be conditional
// on the section actually being included in the document.
function resolveSectionMeta(report, meta = {}) {
  const enabledIds = meta.enabledIds instanceof Set ? meta.enabledIds : null;
  return {
    clientName: meta.clientName || report.clientName,
    reportYear: meta.reportYear || DEFAULT_REPORT_YEAR,
    dataSources:
      Array.isArray(meta.dataSources) && meta.dataSources.length
        ? meta.dataSources
        : report.dataSources,
    // No enabled set provided → treat every section as present (full report).
    isEnabled: (id) => !enabledIds || enabledIds.has(id),
  };
}

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
      description: "Full client deliverable — analysis, conclusions and recommendations.",
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
    executive: {
      label: "Executive brief",
      description: "For leadership — headline numbers and key insights at a glance.",
      sectionIds: ["executive-summary", "global-results", "scope-breakdown", "key-insights"],
    },
    compliance: {
      label: "Compliance",
      description: "For audit/verification — method, boundaries and data, no narrative.",
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
      description: "Full client deliverable — analysis, conclusions and recommendations.",
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
    executive: {
      label: "Executive brief",
      description: "For leadership — headline numbers and key insights at a glance.",
      sectionIds: ["executive-summary", "global-results", "lifecycle-breakdown", "key-insights"],
    },
    compliance: {
      label: "Compliance",
      description: "For audit/verification — method, boundaries and data, no narrative.",
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

function ocfContentById(id, report, meta) {
  const { clientName, reportYear, dataSources, isEnabled } = meta;
  const dominantScope = largestBreakdown(report);
  const dominantSite = largestEntity(report);
  const topCategory = report.topCategories[0];
  const unit = report.unit;
  const siteEnabled = isEnabled("site-emissions");
  const categoryEnabled = isEnabled("detailed-categories");

  // Executive-summary cross-references are conditional on the referenced
  // sections being present, so e.g. the Executive brief does not promise site /
  // category analysis the document omits.
  const summaryPointers = [];
  if (siteEnabled) {
    summaryPointers.push(
      dominantSite
        ? `${dominantSite.name} is the largest single site contributor`
        : "The reported perimeter",
    );
  }
  if (categoryEnabled && topCategory) {
    summaryPointers.push(
      `${topCategory.label} is the most material Scope 3 category`,
    );
  }
  let summaryPriorities = "";
  if (summaryPointers.length === 2) {
    summaryPriorities = `${summaryPointers[0]} and ${summaryPointers[1]}, which together point to where supplier engagement, energy sourcing and primary-data improvements deliver the greatest reduction per unit of effort. `;
  } else if (summaryPointers.length === 1) {
    summaryPriorities = `${summaryPointers[0]}, which points to where supplier engagement, energy sourcing and primary-data improvements deliver the greatest reduction per unit of effort. `;
  }

  // Key insights only list the site / category bullets when those sections are
  // included in the report.
  const keyInsights = [
    `${dominantScope.label} is the largest emissions scope, representing ${formatPercent(dominantScope.percentage)} of total emissions and setting the main direction for reduction work.`,
  ];
  if (siteEnabled) {
    keyInsights.push(
      dominantSite
        ? `${dominantSite.name} is the largest site contributor with ${formatEmissions(dominantSite.totalEmissions, unit)}, making it a priority location for operational follow-up.`
        : "No site rows were available in the uploaded CSV.",
    );
  }
  if (categoryEnabled) {
    keyInsights.push(
      topCategory
        ? `${topCategory.label} is the largest Scope 3 category with ${formatEmissions(topCategory.value, unit)}, indicating where supplier, material or logistics analysis may be most valuable.`
        : "No recognised Scope 3 category values were available.",
    );
  }

  const content = {
    "executive-summary": `${clientName}'s ${reportYear} organisational carbon footprint amounts to ${formatEmissions(report.total.totalEmissions, unit)} across the reported ${report.boundaryBasis} boundary, consolidated from ${report.entities.length} production sites. ${dominantScope.label} is the dominant source, representing ${formatPercent(dominantScope.percentage)} of the total, so decarbonisation effort should concentrate first on its underlying value-chain and operational drivers.\n${summaryPriorities}The following sections present the quantified results and the priorities they point to.`,
    introduction: `The present report summarises the results of the ${reportYear} organisational carbon footprint assessment for ${clientName}. It provides a quantitative overview of emissions by scope, site and category, and creates a structured basis for management discussion, supplier engagement and future decarbonisation planning.\nThe assessment is generated from the uploaded dataset and incorporates client-specific context where relevant, including organisational changes, production variations, exclusions and improvement actions.`,
    methodology: `This assessment follows the ${report.standardLong} methodology and the ${report.ghgProtocol}, two internationally recognised frameworks for quantifying and reporting greenhouse gas emissions. The organisational boundary is defined under the ${report.boundaryBasis} criterion.\nActivity data combine primary records with secondary emission factors from recognised databases (${dataSources.join(", ")}). Source activity data are expressed in kilograms of CO₂-equivalent and reported here in tonnes (tCO₂e); the same unit is applied consistently across every figure, table and chart so the document stays internally comparable.\nThe application validates the required schema, normalises company and site totals, groups emissions by Scope 1, Scope 2 and Scope 3, and renders the same configured report model in the browser preview and PDF export. Emission-factor versions, data-quality assumptions and any methodological change versus the prior reporting year are documented alongside the dataset.`,
    "organisational-boundary":
      report.totalSource === "official"
        ? "The organisational boundary follows the entities listed in the uploaded CSV. The Total empresa row is treated as the official consolidated company result, while the plant rows are used to explain the contribution of each site to the overall footprint."
        : "The organisational boundary follows the entities listed in the uploaded CSV. Because no Total empresa row was provided, the consolidated company result is calculated from the available site rows.",
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
      `Scope 2 represents purchased electricity, heat or steam. The reported Scope 2 contribution is ${formatEmissions(report.breakdown[1]?.value, unit)} (${formatPercent(report.breakdown[1]?.percentage)}). Electricity sourcing, market- and location-based assumptions and renewable-energy evidence are documented here where available.`,
      `Scope 3 represents the wider value chain and contributes ${formatEmissions(report.breakdown[2]?.value, unit)} (${formatPercent(report.breakdown[2]?.percentage)}). The largest recognised Scope 3 hotspot is ${topCategory ? `${topCategory.label} at ${formatEmissions(topCategory.value, unit)}` : "not available from the dataset"}, making supplier, material, logistics and end-of-life analysis central to the reduction roadmap.`,
    ].join("\n"),
    "comparative-analysis": `No prior-year baseline is included in the uploaded dataset, so ${reportYear} is treated as the reference year for future comparison. Subsequent reporting cycles will track total emissions, scope-level changes, perimeter changes and production- or revenue-intensity indicators against this baseline, noting any methodological change that affects comparability.`,
    "key-insights": keyInsights.join("\n"),
    limitations:
      "This configurable report presents the calculated footprint from the uploaded dataset; it does not recalculate emission factors or audit the underlying activity data. The figures depend on the quality and completeness of the source activity data, which should be validated against primary records before external publication. Planned enhancements include deeper primary-data collection for the most material categories and an externally assured reporting cycle.",
    "overall-conclusions": `The results confirm that ${clientName}'s footprint is primarily driven by ${dominantScope.label}, with ${dominantSite ? dominantSite.name : "the reported perimeter"} acting as an important operational reference point. The interpretation connects these results to business activity, procurement patterns, site operations and any changes in organisational perimeter.\nThe configured report provides a robust basis for internal review; publication is preceded by a final methodological review, evidence checks and management sign-off on reduction priorities.`,
    "strategic-recommendations": [
      "Prioritise the largest material categories and supplier groups for primary-data improvement and lower-carbon sourcing.",
      "Expand renewable electricity procurement or on-site generation where Scope 2 or electricity-linked Scope 3 categories are material.",
      "Strengthen site-level data ownership so future reporting cycles can compare performance consistently year over year.",
      "Develop a reduction roadmap that separates quick operational actions from longer-term product, material and supplier changes.",
    ].join("\n"),
  };

  return content[id] ?? "";
}

function pcfContentById(id, report, meta) {
  const { clientName, reportYear, dataSources, isEnabled } = meta;
  const dominantStage = largestBreakdown(report);
  const dominantProduct = largestEntity(report);
  const topCategory = report.topCategories[0];
  const unit = report.unit;
  const functionalUnit = report.entities.find((entity) => entity.meta)?.meta;
  const productEnabled = isEnabled("product-results");
  const categoryEnabled = isEnabled("detailed-categories");
  // Boundary-aware copy. `cradle-to-gate` reports only the upstream-to-gate
  // stages (downstream excluded); `cradle-to-grave` reports the full life cycle.
  // Both phrasings stay client-neutral: the boundary rationale is tied to the
  // product's final application, not to a specific business model. The
  // "comparative portfolio sum, not additive" caveat is kept in BOTH modes (it
  // depends on differing functional units, not on the boundary).
  const boundary = report.boundaryBasis;
  const isGate = boundary === "cradle-to-gate";
  // Stage-appropriate driver clause: the dominant stage can be any of the six
  // (e.g. Use under cradle-to-grave), so "materials, processes and logistics"
  // is not always accurate. Keyed by stage label, with a neutral fallback.
  const STAGE_DRIVERS = {
    "Materials": "the composition and origin of the raw and packaging materials",
    "Manufacturing": "energy use and process efficiency at the manufacturing stage",
    "Transport": "transport distances, modes and load efficiency",
    "Distribution": "the distribution logistics to the customer",
    "Use": "energy and resource consumption during product use",
    "End of life": "collection, treatment and final disposal of the product",
  };

  // Key insights only list the product / category bullets when those sections
  // are included in the report (e.g. the Executive brief omits product-results).
  const keyInsights = [
    `The ${dominantStage.label} stage is the largest contributor, representing ${formatPercent(dominantStage.percentage)} of ${boundary} emissions and setting the main direction for product improvement work.`,
  ];
  if (productEnabled) {
    keyInsights.push(
      dominantProduct
        ? `${dominantProduct.name} is the highest-impact product with ${formatEmissions(dominantProduct.totalEmissions, unit)}, making it a priority for design and sourcing review.`
        : "No product rows were available in the uploaded CSV.",
    );
  }
  if (categoryEnabled) {
    keyInsights.push(
      topCategory
        ? `${topCategory.label} is the largest lifecycle category with ${formatEmissions(topCategory.value, unit)}, indicating where material, process or logistics analysis may be most valuable.`
        : "No recognised lifecycle category values were available.",
    );
  }

  const content = {
    "executive-summary": isGate
      ? `This ${reportYear} product carbon footprint assessment for ${clientName} compares ${report.entities.length} products on a cradle-to-gate basis, each quantified per its own functional unit. Because the products and functional units differ, the figures are presented as a comparison rather than a single additive footprint. The ${dominantStage.label} stage is the dominant in-boundary contributor at ${formatPercent(dominantStage.percentage)} of cradle-to-gate emissions, which is where product-level reduction effort is likely to be most effective.\nDistribution, use and end-of-life are downstream of the factory gate and depend on the final application of the product, so they are reported out of boundary for reference and excluded from the footprint and hotspots.`
      : `This ${reportYear} product carbon footprint assessment for ${clientName} compares ${report.entities.length} products over the full cradle-to-grave life cycle, each quantified per its own functional unit. Because the products and functional units differ, the figures are presented as a comparison rather than a single additive footprint. The ${dominantStage.label} stage is the dominant contributor at ${formatPercent(dominantStage.percentage)} of cradle-to-grave emissions, which is where product-level reduction effort is likely to be most effective.\nThe full life cycle is assessed, from raw materials through manufacturing, transport, distribution, use and end of life, so every stage is reflected in the reported footprint and hotspots.`,
    introduction: `The present report summarises the product carbon footprint assessment for the products listed in the uploaded dataset. It provides a quantitative overview of ${boundary} lifecycle-stage emissions and a structured base for product design, sourcing, manufacturing and logistics decisions.\nClient-specific context is incorporated where relevant, including product families, production sites, part-number groupings, functional-unit rationale and customer requirements.`,
    methodology: isGate
      ? `This assessment follows the ${report.standardLong} methodology and the ${report.ghgProtocol}. The system boundary is cradle-to-gate: it covers the raw-materials, manufacturing and transport stages up to the factory gate. Distribution, use and end-of-life depend on the final application of the product, so they fall outside the boundary and are reported separately for reference only.\nActivity data combine primary records with secondary life-cycle inventory factors from recognised databases (${dataSources.join(", ")}). Source activity data are expressed in grams of CO₂-equivalent per functional unit (gCO₂e), the unit applied consistently across every figure, table and chart. The application validates the required schema, normalises per-product totals, groups emissions by lifecycle stage and renders the same configured report model in the browser preview and PDF export. Allocation rules, emission-factor versions and transport assumptions are documented alongside the dataset.`
      : `This assessment follows the ${report.standardLong} methodology and the ${report.ghgProtocol}. The system boundary is cradle-to-grave: the full life cycle is reported, covering raw materials, manufacturing, transport, distribution, use and end of life, so no stage is excluded from the footprint.\nActivity data combine primary records with secondary life-cycle inventory factors from recognised databases (${dataSources.join(", ")}). Source activity data are expressed in grams of CO₂-equivalent per functional unit (gCO₂e), the unit applied consistently across every figure, table and chart. The application validates the required schema, normalises per-product totals, groups emissions by lifecycle stage and renders the same configured report model in the browser preview and PDF export. Allocation rules, emission-factor versions and transport assumptions are documented alongside the dataset.`,
    "product-scope": isGate
      ? "The product scope follows the products listed in the uploaded CSV. Each row represents a product whose cradle-to-gate emissions are reported per functional unit, allowing comparison of relative impact across the assessed portfolio. The boundary stops at the factory gate: downstream distribution, use and end-of-life stages are reported out of boundary for transparency only, as they depend on the final application of the product."
      : "The product scope follows the products listed in the uploaded CSV. Each row represents a product whose cradle-to-grave emissions are reported per functional unit, allowing comparison of relative impact across the assessed portfolio. The full life cycle is assessed, from raw materials through manufacturing, transport, distribution, use and end of life, so every stage is included in the reported footprint.",
    "functional-unit": functionalUnit
      ? `Results are expressed per functional unit as declared in the dataset (e.g. "${functionalUnit}"). The functional unit defines the reference flow against which all in-boundary lifecycle-stage emissions are quantified and ensures comparability between products. Per-product functional units are shown alongside each product in the results table. Product names and functional units are shown exactly as provided in the source dataset.`
      : "Results are expressed per functional unit as declared in the dataset. The functional unit defines the reference flow against which all in-boundary lifecycle-stage emissions are quantified and the basis used to ensure comparability between products. Product names and functional units are shown exactly as provided in the source dataset.",
    "global-results": `The headline indicators below summarise the ${boundary} results. As products and functional units differ, the combined figure is a comparative portfolio sum, not a single additive product footprint; per-product results are shown in the product table.`,
    "lifecycle-breakdown": isGate
      ? "The in-boundary lifecycle distribution helps identify whether cradle-to-gate emissions are mainly driven by raw materials, manufacturing or upstream logistics. Because products use different functional units, per-stage totals and shares are comparative aggregates rather than a single additive footprint."
      : "The lifecycle distribution helps identify whether cradle-to-grave emissions are mainly driven by raw materials, manufacturing, logistics or the downstream distribution, use and end-of-life stages. Because products use different functional units, per-stage totals and shares are comparative aggregates rather than a single additive footprint.",
    "product-results":
      "The product view shows how emissions are distributed across the assessed products and supports prioritisation of redesign or sourcing decisions.",
    "detailed-categories":
      "The lifecycle tables provide the most granular view available in the uploaded dataset and help trace the sources behind each stage total.",
    "lifecycle-analysis": [
      `The ${dominantStage.label} stage is the largest contributor at ${formatEmissions(dominantStage.value, unit)} (${formatPercent(dominantStage.percentage)} of ${boundary} emissions), driven by ${STAGE_DRIVERS[dominantStage.label] || "the activities within that stage"}.`,
      dominantProduct
        ? `${dominantProduct.name} is the highest ${boundary} product at ${formatEmissions(dominantProduct.totalEmissions, unit)}; its functional unit, material composition, manufacturing site and transport route make it the priority for improvement options.`
        : "No product rows were available for product-level interpretation.",
      functionalUnit
        ? `The declared functional unit (${functionalUnit}) is used consistently when comparing variants, sites or product families.`
        : "The functional-unit basis defines how product variants are compared and portfolio results aggregated.",
    ].join("\n"),
    "key-insights": keyInsights.join("\n"),
    limitations: isGate
      ? "This configurable report presents the calculated cradle-to-gate footprint from the uploaded dataset; it does not recalculate emission factors or audit the underlying activity data. Because products use different functional units, the combined figure is a comparison rather than an additive total. Downstream distribution, use and end-of-life emissions are reported out of boundary and excluded from the footprint. Planned enhancements include deeper primary-data collection for the most material lifecycle categories and an externally assured reporting cycle."
      : "This configurable report presents the calculated cradle-to-grave footprint from the uploaded dataset; it does not recalculate emission factors or audit the underlying activity data. Because products use different functional units, the combined figure is a comparison rather than an additive total. The full life cycle is reported, so the downstream distribution, use and end-of-life stages depend on assumptions about each product's final application. Planned enhancements include deeper primary-data collection for the most material lifecycle categories and an externally assured reporting cycle.",
    "overall-conclusions": `The ${boundary} results are mainly shaped by ${dominantStage.label}, which guides the first wave of reduction analysis towards material composition, supplier geography, manufacturing energy and transport routes.\nThe configured report provides a robust comparison base across the assessed products; primary-data and evidence checks accompany the dataset before external publication.`,
    "strategic-recommendations": [
      "Focus material substitution and supplier engagement on the highest-emission lifecycle categories.",
      "Review renewable electricity and process-efficiency options at manufacturing sites where manufacturing emissions are material.",
      "Assess localised or lower-carbon logistics options for products with meaningful transport contributions.",
      "Build product-family baselines so future design changes can be compared against a consistent functional unit.",
    ].join("\n"),
  };

  return content[id] ?? "";
}

function defaultContentById(id, report, meta) {
  return reportKind(report) === "pcf"
    ? pcfContentById(id, report, meta)
    : ocfContentById(id, report, meta);
}

// `meta` carries the form-driven metadata that the generated copy reads:
// `{ clientName, reportYear, dataSources, enabledIds }`. All are optional — each
// falls back to the report defaults so `buildReportSections(report)` reproduces
// the original sample output.
export function buildReportSections(report, meta = {}) {
  const definitions = SECTION_DEFINITIONS_BY_KIND[reportKind(report)];
  const resolved = resolveSectionMeta(report, meta);

  return definitions.map((section) => ({
    ...section,
    enabled: true,
    // `dirty` tracks manual edits so metadata/section-set changes can regenerate
    // untouched copy while preserving the user's edits (see
    // `regenerateSectionContent`).
    dirty: false,
    content: defaultContentById(section.id, report, resolved),
  }));
}

// Regenerate the auto-generated copy in place when the metadata (client name,
// year, data sources) or the enabled-section set changes. Sections the user has
// edited (`dirty`) and custom sections are left untouched.
export function regenerateSectionContent(sections, report, meta = {}) {
  const resolved = resolveSectionMeta(report, meta);

  return sections.map((section) => {
    if (section.dirty || section.removable) {
      return section;
    }
    return { ...section, content: defaultContentById(section.id, report, resolved) };
  });
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
