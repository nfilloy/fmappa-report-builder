import { LIFECYCLE_COLORS } from "../report/chartTheme.js";
import { pickEmissionUnit } from "../formatters.js";

import { parseNumber, percentage, sumBy } from "./numeric.js";

const REQUIRED_COLUMNS = ["product", "functional_unit", "total_emissions"];

// Lifecycle stages (ISO 14067). Each stage maps a CSV total column and an
// entity value key, and groups its detailed sub-categories.
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

  return {
    product: record.product?.trim() || "Unnamed product",
    functionalUnit: record.functional_unit?.trim() || "",
    totalEmissions: parseNumber(record.total_emissions),
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
  const totalEmissions = sumBy(products, (product) => product.totalEmissions);

  const breakdown = PCF_STAGE_GROUPS.map((group, index) => {
    const value = sumBy(products, (product) => product.stageTotals[group.valueKey]);
    return {
      label: group.stage,
      value,
      percentage: percentage(value, totalEmissions),
      color: LIFECYCLE_COLORS[index % LIFECYCLE_COLORS.length],
    };
  });

  const entities = products.map((product) => ({
    name: product.product,
    totalEmissions: product.totalEmissions,
    meta: product.functionalUnit,
    values: PCF_STAGE_GROUPS.reduce((accumulator, group) => {
      accumulator[group.valueKey] = product.stageTotals[group.valueKey];
      return accumulator;
    }, {}),
  }));

  const categoryBreakdown = PCF_STAGE_GROUPS.map((group) => ({
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
    .slice(0, 5);

  return {
    kind: "pcf",
    fileName,
    clientName: "RELATS S.A.U.",
    reportTitle: "Products Carbon Footprint Report 2024",
    standard: "ISO 14067",
    standardLong: "ISO 14067:2018",
    ghgProtocol: "GHG Protocol Product Life Cycle Accounting and Reporting Standard",
    dataSources: ["EXIOBASE", "DEFRA", "IEA", "OCCC"],
    boundaryBasis: "product life cycle (per declared stages)",
    unit: pickEmissionUnit(totalEmissions),
    showFunctionalUnit: true,
    coverBadge: "PCF",
    coverSubtitle:
      "Configurable product carbon footprint report generated from the uploaded PCF dataset, broken down by lifecycle stage.",
    totalSource: "aggregated",
    totalSourceLabel: "Aggregated from product rows",
    total: { totalEmissions },
    breakdownTitle: "Lifecycle stage breakdown",
    breakdown,
    entityLabel: "Product",
    entityNoun: "products",
    entityColumns: PCF_STAGE_GROUPS.map((group) => ({
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
