import { LIFECYCLE_COLORS, SEQUENTIAL_COLORS } from "../report/chartTheme.js";
import { pickEmissionUnit } from "../formatters.js";

import { parseNumber, percentage, sumBy } from "./numeric.js";

const REQUIRED_COLUMNS = ["product", "functional_unit", "total_emissions"];

// Lifecycle stages (ISO 14067). Each stage maps a CSV total column and an
// entity value key, and groups its detailed sub-categories. Stage membership of
// the reporting boundary is no longer fixed here: it is derived per report from
// the selected boundary preset (see `PCF_BOUNDARIES`).
export const PCF_STAGE_GROUPS = [
  {
    stage: "Materials",
    totalColumn: "total_materials",
    valueKey: "materials",
    categories: [
      ["1_1_raw_materials", "1.1 Raw materials"],
      ["1_2_inbound_packaging_material", "1.2 Inbound packaging material"],
      ["1_3_outbound_packaging_material", "1.3 Outbound packaging material"],
    ],
  },
  {
    stage: "Manufacturing",
    totalColumn: "total_manufacturing",
    valueKey: "manufacturing",
    categories: [
      ["2_1_electricity_use_in_manufacturing", "2.1 Electricity use in manufacturing"],
      ["2_2_other_energy_use_in_manufacturing", "2.2 Other energy use in manufacturing"],
      ["2_3_consumables_and_additives", "2.3 Consumables and additives"],
      ["2_4_waste_generated", "2.4 Waste generated"],
    ],
  },
  {
    stage: "Transport",
    totalColumn: "total_transport",
    valueKey: "transport",
    categories: [
      ["3_1_transport_of_materials", "3.1 Transport of materials"],
      ["3_2_transport_of_packaging", "3.2 Transport of packaging"],
      ["3_3_transport_of_consumables_and_additives", "3.3 Transport of consumables and additives"],
      ["3_4_transport_of_waste_to_waste_manager", "3.4 Transport of waste to waste manager"],
      ["3_5_internal_transport", "3.5 Internal transport"],
    ],
  },
  {
    stage: "Distribution",
    totalColumn: "total_distribution",
    valueKey: "distribution",
    categories: [["4_1_product_distribution", "4.1 Product distribution"]],
  },
  {
    stage: "Use",
    totalColumn: "total_use",
    valueKey: "use",
    categories: [
      ["5_1_product_use", "5.1 Product use"],
      ["5_2_maintenance_and_servicing", "5.2 Maintenance and servicing"],
      ["5_3_other_use_stage_emissions", "5.3 Other use-stage emissions"],
    ],
  },
  {
    stage: "End of life",
    totalColumn: "total_end_of_life",
    valueKey: "endOfLife",
    categories: [
      ["6_1_collection_and_transport_of_end_of_life_products", "6.1 Collection and transport of end-of-life products"],
      ["6_2_end_of_life_treatment", "6.2 End-of-life treatment"],
      ["6_3_final_disposal", "6.3 Final disposal"],
    ],
  },
];

// User-selectable system boundary presets, keyed by stage `valueKey`. A stage is
// in-boundary when its valueKey is listed for the selected boundary; any stage
// not listed is reported out of boundary for reference only.
//   - cradle-to-gate: Relats supplies intermediate components, so only the
//     upstream-to-gate stages count towards the footprint.
//   - cradle-to-grave: the full life cycle is assessed; no stage is excluded.
export const PCF_BOUNDARIES = {
  "cradle-to-gate": ["materials", "manufacturing", "transport"],
  "cradle-to-grave": [
    "materials",
    "manufacturing",
    "transport",
    "distribution",
    "use",
    "endOfLife",
  ],
};

export const DEFAULT_PCF_BOUNDARY = "cradle-to-gate";

const ALL_CATEGORY_COLUMNS = PCF_STAGE_GROUPS.flatMap((group) =>
  group.categories.map(([key]) => key),
);

// Split the stage groups into in-boundary / out-of-boundary for the selected
// preset. Falls back to the default boundary for an unknown value.
function resolveStageGroups(boundary) {
  const includedKeys = new Set(
    PCF_BOUNDARIES[boundary] ?? PCF_BOUNDARIES[DEFAULT_PCF_BOUNDARY],
  );
  return {
    included: PCF_STAGE_GROUPS.filter((group) => includedKeys.has(group.valueKey)),
    excluded: PCF_STAGE_GROUPS.filter((group) => !includedKeys.has(group.valueKey)),
  };
}

// Boundary-dependent report copy. The comparative caveat is intentionally NOT
// part of this map: it depends on differing functional units, not on the
// boundary, so it stays in the shared copy for both modes.
const BOUNDARY_COPY = {
  "cradle-to-gate": {
    coverSubtitle:
      "Configurable cradle-to-gate product carbon footprint report generated from the uploaded PCF dataset, broken down by lifecycle stage and compared across products.",
    excludedStagesNote:
      "Distribution, Use and End of life sit downstream of the factory gate and depend on the customer's final product. They are reported out of boundary for reference only and are excluded from the footprint, percentages and hotspots.",
  },
  "cradle-to-grave": {
    coverSubtitle:
      "Configurable cradle-to-grave product carbon footprint report generated from the uploaded PCF dataset, broken down across the full life cycle and compared across products.",
    excludedStagesNote: "",
  },
};

function normalizeRecord(record, includedStageGroups) {
  const stageTotals = PCF_STAGE_GROUPS.reduce((accumulator, group) => {
    accumulator[group.valueKey] = parseNumber(record[group.totalColumn]);
    return accumulator;
  }, {});

  const categories = ALL_CATEGORY_COLUMNS.reduce((accumulator, key) => {
    accumulator[key] = parseNumber(record[key]);
    return accumulator;
  }, {});

  // Reported footprint = the in-boundary stages for the selected boundary. The
  // CSV's total_emissions column is the full cradle-to-grave figure, kept for
  // reference; under cradle-to-grave it equals the in-boundary total.
  const inBoundaryTotal = includedStageGroups.reduce(
    (sum, group) => sum + stageTotals[group.valueKey],
    0,
  );

  return {
    product: record.product?.trim() || "Unnamed product",
    functionalUnit: record.functional_unit?.trim() || "",
    cradleToGrave: parseNumber(record.total_emissions),
    inBoundaryTotal,
    totalEmissions: inBoundaryTotal,
    stageTotals,
    categories,
    raw: record,
  };
}

export function validatePcfRows(rows) {
  if (!rows.length) {
    return { valid: false, error: "The CSV does not contain any data rows." };
  }

  const columns = Object.keys(rows[0]);
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.includes(column));

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required columns: ${missing.join(", ")}.`,
    };
  }

  return { valid: true, error: null };
}

export function buildPcfReport(rows, fileName = "Uploaded CSV", options = {}) {
  const validation = validatePcfRows(rows);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const boundary = PCF_BOUNDARIES[options.boundary]
    ? options.boundary
    : DEFAULT_PCF_BOUNDARY;
  const { included: INCLUDED_STAGE_GROUPS, excluded: EXCLUDED_STAGE_GROUPS } =
    resolveStageGroups(boundary);
  const boundaryCopy = BOUNDARY_COPY[boundary];

  const products = rows.map((record) =>
    normalizeRecord(record, INCLUDED_STAGE_GROUPS),
  );
  // Reported footprint is the in-boundary stage sum for the selected boundary.
  const totalEmissions = sumBy(products, (product) => product.inBoundaryTotal);
  // Full cradle-to-grave figure from the CSV, shown only as out-of-boundary
  // reference so the exclusions are transparent (cradle-to-gate).
  const cradleToGraveTotal = sumBy(products, (product) => product.cradleToGrave);

  const breakdown = INCLUDED_STAGE_GROUPS.map((group, index) => {
    const value = sumBy(products, (product) => product.stageTotals[group.valueKey]);
    return {
      label: group.stage,
      value,
      percentage: percentage(value, totalEmissions),
      color: LIFECYCLE_COLORS[index % LIFECYCLE_COLORS.length],
    };
  });

  // Downstream stages excluded from the boundary, reported for reference only.
  const excludedStages = EXCLUDED_STAGE_GROUPS.map((group) => {
    const value = sumBy(products, (product) => product.stageTotals[group.valueKey]);
    return {
      label: group.stage,
      value,
      // Share of the would-be cradle-to-grave total, to show how much sits
      // outside the reported boundary — never part of the headline footprint.
      percentage: percentage(value, cradleToGraveTotal),
    };
  });
  const excludedTotal = sumBy(excludedStages, (stage) => stage.value);

  const entities = products.map((product) => ({
    name: product.product,
    totalEmissions: product.inBoundaryTotal,
    meta: product.functionalUnit,
    values: INCLUDED_STAGE_GROUPS.reduce((accumulator, group) => {
      accumulator[group.valueKey] = product.stageTotals[group.valueKey];
      return accumulator;
    }, {}),
  }));

  const categoryBreakdown = INCLUDED_STAGE_GROUPS.map((group) => ({
    group: group.stage,
    categories: group.categories.map(([key, label]) => ({
      key,
      label,
      total: sumBy(products, (product) => product.categories[key]),
      perEntity: products.map((product) => ({
        name: product.product,
        value: product.categories[key],
      })),
    })),
  }));

  const topCategories = categoryBreakdown
    .flatMap((group) => group.categories)
    .map((category) => ({
      key: category.key,
      label: category.label,
      value: category.total,
    }))
    .filter((category) => category.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((category, index) => ({
      ...category,
      color: SEQUENTIAL_COLORS[index % SEQUENTIAL_COLORS.length],
    }));

  return {
    kind: "pcf",
    fileName,
    clientName: "RELATS S.A.U.",
    reportTitle: "Products Carbon Footprint Report 2024",
    standard: "ISO 14067",
    standardLong: "ISO 14067:2018",
    ghgProtocol: "GHG Protocol Product Life Cycle Accounting and Reporting Standard",
    dataSources: ["EXIOBASE", "DEFRA", "IEA", "OCCC"],
    boundaryBasis: boundary,
    unit: pickEmissionUnit(totalEmissions, "pcf"),
    showFunctionalUnit: true,
    coverBadge: "PCF",
    // Per-product footprints are not additive (different products, different
    // functional units), so the cover leads with the comparison itself and keeps
    // the combined number as a secondary, clearly-caveated figure.
    coverHeadline: `${products.length} products compared`,
    coverHeadlineNote: boundary,
    coverTotalLabel: "combined footprint (comparative)",
    coverSubtitle: boundaryCopy.coverSubtitle,
    totalSource: "aggregated",
    totalSourceLabel: `Comparative sum of product rows (${boundary})`,
    // The headline figure is a cross-product comparison, not an additive
    // footprint, so it is labelled accordingly wherever it surfaces.
    totalMetricLabel: "Comparative total",
    total: { totalEmissions },
    // Excluded (out-of-boundary) stages, reported for transparency. Empty under
    // cradle-to-grave, where the full life cycle is in boundary.
    cradleToGraveTotal,
    excludedStages,
    excludedTotal,
    excludedStagesNote: boundaryCopy.excludedStagesNote,
    breakdownTitle: "Lifecycle stage breakdown",
    breakdown,
    entityLabel: "Product",
    entityNoun: "products",
    entityColumns: INCLUDED_STAGE_GROUPS.map((group) => ({
      key: group.valueKey,
      label: group.stage,
    })),
    entities,
    categoryBreakdown,
    categoryTotalLabel: "Total",
    topTitle: "Top lifecycle hotspots",
    topEmptyText: "No recognised lifecycle category values were available.",
    topCategories,
  };
}
