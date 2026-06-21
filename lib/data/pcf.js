import { LIFECYCLE_COLORS, SEQUENTIAL_COLORS } from "../report/chartTheme.js";
import { pickEmissionUnit } from "../formatters.js";

import { parseNumber, percentage, sumBy } from "./numeric.js";

const REQUIRED_COLUMNS = ["product", "functional_unit", "total_emissions"];

// Lifecycle stages (ISO 14067). Each stage maps a CSV total column and an
// entity value key, and groups its detailed sub-categories.
//
// `boundary` declares whether the stage is inside Relats' reporting boundary.
// Relats manufactures intermediate components that are integrated into its
// customers' final products, so the studies are cradle-to-gate: only Materials,
// Manufacturing and Transport count towards the footprint. Distribution, Use and
// End of life are downstream of the factory gate and depend on the customer's
// final product, so they are reported "out of boundary" for reference only and
// excluded from totals, percentages and hotspots.
export const PCF_STAGE_GROUPS = [
  {
    stage: "Materials",
    totalColumn: "total_materials",
    valueKey: "materials",
    boundary: "included",
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
    boundary: "included",
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
    boundary: "included",
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
    boundary: "downstream",
    categories: [["4_1_product_distribution", "4.1 Product distribution"]],
  },
  {
    stage: "Use",
    totalColumn: "total_use",
    valueKey: "use",
    boundary: "downstream",
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
    boundary: "downstream",
    categories: [
      ["6_1_collection_and_transport_of_end_of_life_products", "6.1 Collection and transport of end-of-life products"],
      ["6_2_end_of_life_treatment", "6.2 End-of-life treatment"],
      ["6_3_final_disposal", "6.3 Final disposal"],
    ],
  },
];

const INCLUDED_STAGE_GROUPS = PCF_STAGE_GROUPS.filter(
  (group) => group.boundary !== "downstream",
);
const EXCLUDED_STAGE_GROUPS = PCF_STAGE_GROUPS.filter(
  (group) => group.boundary === "downstream",
);

const ALL_CATEGORY_COLUMNS = PCF_STAGE_GROUPS.flatMap((group) =>
  group.categories.map(([key]) => key),
);

function normalizeRecord(record) {
  const stageTotals = PCF_STAGE_GROUPS.reduce((accumulator, group) => {
    accumulator[group.valueKey] = parseNumber(record[group.totalColumn]);
    return accumulator;
  }, {});

  const categories = ALL_CATEGORY_COLUMNS.reduce((accumulator, key) => {
    accumulator[key] = parseNumber(record[key]);
    return accumulator;
  }, {});

  // Cradle-to-gate footprint = only the in-boundary stages. The CSV's
  // total_emissions column is the full cradle-to-grave figure, kept for
  // reference but not used as the reported product footprint.
  const cradleToGate = INCLUDED_STAGE_GROUPS.reduce(
    (sum, group) => sum + stageTotals[group.valueKey],
    0,
  );

  return {
    product: record.product?.trim() || "Unnamed product",
    functionalUnit: record.functional_unit?.trim() || "",
    cradleToGrave: parseNumber(record.total_emissions),
    cradleToGate,
    totalEmissions: cradleToGate,
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

export function buildPcfReport(rows, fileName = "Uploaded CSV") {
  const validation = validatePcfRows(rows);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const products = rows.map(normalizeRecord);
  // Reported footprint is cradle-to-gate (in-boundary stages only).
  const totalEmissions = sumBy(products, (product) => product.cradleToGate);
  // Full cradle-to-grave figure from the CSV, shown only as out-of-boundary
  // reference so the exclusions are transparent.
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
    totalEmissions: product.cradleToGate,
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
    boundaryBasis: "cradle-to-gate",
    unit: pickEmissionUnit(totalEmissions, "pcf"),
    showFunctionalUnit: true,
    coverBadge: "PCF",
    // Per-product footprints are not additive (different products, different
    // functional units), so the cover leads with the comparison itself and keeps
    // the combined number as a secondary, clearly-caveated figure.
    coverHeadline: `${products.length} products compared`,
    coverHeadlineNote: "cradle-to-gate",
    coverTotalLabel: "combined footprint (comparative)",
    coverSubtitle:
      "Configurable cradle-to-gate product carbon footprint report generated from the uploaded PCF dataset, broken down by lifecycle stage and compared across products.",
    totalSource: "aggregated",
    totalSourceLabel: "Comparative sum of product rows (cradle-to-gate)",
    // The headline figure is a cross-product comparison, not an additive
    // footprint, so it is labelled accordingly wherever it surfaces.
    totalMetricLabel: "Comparative total",
    total: { totalEmissions },
    // Excluded (downstream) stages, reported out of boundary for transparency.
    cradleToGraveTotal,
    excludedStages,
    excludedTotal,
    excludedStagesNote:
      "Distribution, Use and End of life sit downstream of the factory gate and depend on the customer's final product. They are reported out of boundary for reference only and are excluded from the footprint, percentages and hotspots.",
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
