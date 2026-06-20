import { SCOPE_COLORS } from "../report/chartTheme.js";
import { pickEmissionUnit } from "../formatters.js";

import { parseNumber, percentage, sumBy } from "./numeric.js";

const REQUIRED_COLUMNS = [
  "entity",
  "total_emissions",
  "total_scope_1",
  "total_scope_2",
  "total_scope_3",
];

export const OCF_CATEGORY_GROUPS = [
  {
    scope: "Scope 1",
    categories: [
      ["scope_1_1_stationary_combustion", "1.1 Stationary combustion"],
      ["scope_1_2_mobile_combustion", "1.2 Mobile combustion"],
      ["scope_1_3_process_emissions", "1.3 Process emissions"],
      ["scope_1_4_1_refrigerant_gases", "1.4.1 Refrigerant gases"],
      ["scope_1_4_2_fire_extinguishers", "1.4.2 Fire extinguishers"],
    ],
  },
  {
    scope: "Scope 2",
    categories: [
      ["scope_2_1_1_purchased_electricity", "2.1.1 Purchased electricity"],
      ["scope_2_1_2_purchased_heat_or_steam", "2.1.2 Purchased heat or steam"],
    ],
  },
  {
    scope: "Scope 3",
    categories: [
      ["scope_3_1_1_raw_materials_or_auxiliary_materials", "3.1.1 Raw materials or auxiliary materials"],
      ["scope_3_1_2_water_consumption", "3.1.2 Water consumption"],
      ["scope_3_1_3_services", "3.1.3 Services"],
      ["scope_3_2_capital_fixed_assets", "3.2 Capital fixed assets"],
      ["scope_3_3_fuel_and_energy_related_activities", "3.3 Fuel and energy-related activities"],
      ["scope_3_4_upstream_transport_and_distribution", "3.4 Upstream transport and distribution"],
      ["scope_3_5_waste_generated_in_operations", "3.5 Waste generated in operations"],
      ["scope_3_6_business_travel", "3.6 Business travel"],
      ["scope_3_7_employee_commuting", "3.7 Employee commuting"],
      ["scope_3_8_upstream_leased_assets", "3.8 Upstream leased assets"],
      ["scope_3_9_downstream_transport_and_distribution", "3.9 Downstream transport and distribution"],
      ["scope_3_10_processing_of_sold_products", "3.10 Processing of sold products"],
      ["scope_3_11_use_of_sold_products", "3.11 Use of sold products"],
      ["scope_3_12_end_of_life_treatment_of_sold_products", "3.12 End-of-life treatment of sold products"],
      ["scope_3_13_downstream_leased_assets", "3.13 Downstream leased assets"],
      ["scope_3_14_franchises", "3.14 Franchises"],
      ["scope_3_15_investments", "3.15 Investments"],
    ],
  },
];

const SCOPE_KEYS = ["scope1", "scope2", "scope3"];

const CATEGORY_COLUMNS = OCF_CATEGORY_GROUPS.flatMap((group) =>
  group.categories.map(([key]) => key),
);

function normalizeRecord(record) {
  const categories = CATEGORY_COLUMNS.reduce((accumulator, key) => {
    accumulator[key] = parseNumber(record[key]);
    return accumulator;
  }, {});

  return {
    entity: record.entity?.trim() || "Unnamed entity",
    totalEmissions: parseNumber(record.total_emissions),
    scope1: parseNumber(record.total_scope_1),
    scope2: parseNumber(record.total_scope_2),
    scope3: parseNumber(record.total_scope_3),
    categories,
    raw: record,
  };
}

export function validateOcfRows(rows) {
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

export function buildOcfReport(rows, fileName = "Uploaded CSV") {
  const validation = validateOcfRows(rows);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const normalizedRows = rows.map(normalizeRecord);
  const totalRow = normalizedRows.find(
    (row) => row.entity.toLowerCase() === "total empresa",
  );
  const siteRows = normalizedRows.filter(
    (row) => row.entity.toLowerCase() !== "total empresa",
  );

  const total = totalRow ?? {
    entity: "Total empresa",
    totalEmissions: sumBy(siteRows, (row) => row.totalEmissions),
    scope1: sumBy(siteRows, (row) => row.scope1),
    scope2: sumBy(siteRows, (row) => row.scope2),
    scope3: sumBy(siteRows, (row) => row.scope3),
    categories: CATEGORY_COLUMNS.reduce((accumulator, key) => {
      accumulator[key] = sumBy(siteRows, (row) => row.categories[key]);
      return accumulator;
    }, {}),
    raw: {},
  };

  const breakdown = [
    { label: "Scope 1", value: total.scope1 },
    { label: "Scope 2", value: total.scope2 },
    { label: "Scope 3", value: total.scope3 },
  ].map((item, index) => ({
    ...item,
    percentage: percentage(item.value, total.totalEmissions),
    color: SCOPE_COLORS[index % SCOPE_COLORS.length],
  }));

  const entities = siteRows.map((site) => ({
    name: site.entity,
    totalEmissions: site.totalEmissions,
    values: {
      scope1: site.scope1,
      scope2: site.scope2,
      scope3: site.scope3,
    },
  }));

  const categoryBreakdown = OCF_CATEGORY_GROUPS.map((group) => ({
    group: group.scope,
    categories: group.categories.map(([key, label]) => ({
      key,
      label,
      total: total.categories[key],
      perEntity: siteRows.map((site) => ({
        name: site.entity,
        value: site.categories[key],
      })),
    })),
  }));

  const topCategories = categoryBreakdown
    .find((group) => group.group === "Scope 3")
    .categories.map((category) => ({
      key: category.key,
      label: category.label,
      value: category.total,
    }))
    .filter((category) => category.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const totalSource = totalRow ? "official" : "calculated";

  return {
    kind: "ocf",
    fileName,
    clientName: "RELATS S.A.U.",
    reportTitle: "Organisational Carbon Footprint Report 2024",
    standard: "ISO 14064-1",
    standardLong: "ISO 14064-1:2018",
    ghgProtocol: "GHG Protocol Corporate Accounting and Reporting Standard",
    dataSources: ["DEFRA", "IEA", "OCCC", "ecoinvent", "EXIOBASE"],
    boundaryBasis: "operational control",
    unit: pickEmissionUnit(total.totalEmissions),
    showFunctionalUnit: false,
    coverBadge: "OCF",
    coverSubtitle:
      "Configurable Scope 1, Scope 2 and Scope 3 emissions report generated from the uploaded OCF dataset.",
    totalSource,
    totalSourceLabel:
      totalSource === "official"
        ? "Official Total empresa row"
        : "Calculated from site rows",
    total: { totalEmissions: total.totalEmissions },
    breakdownTitle: "Scope breakdown",
    breakdown,
    entityLabel: "Entity",
    entityNoun: "sites",
    entityColumns: SCOPE_KEYS.map((key, index) => ({
      key,
      label: `Scope ${index + 1}`,
    })),
    entities,
    categoryBreakdown,
    categoryTotalLabel: "Total empresa",
    topTitle: "Top Scope 3 categories",
    topEmptyText: "No recognised Scope 3 category values were available.",
    topCategories,
  };
}
