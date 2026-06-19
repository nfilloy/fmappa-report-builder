const REQUIRED_COLUMNS = [
  "entity",
  "total_emissions",
  "total_scope_1",
  "total_scope_2",
  "total_scope_3",
];

const SCOPE_3_LABELS = {
  purchased_goods_services: "Purchased goods and services",
  capital_goods: "Capital goods",
  fuel_energy_related: "Fuel and energy-related activities",
  upstream_transport_distribution: "Upstream transport and distribution",
  waste_generated_operations: "Waste generated in operations",
  business_travel: "Business travel",
  employee_commuting: "Employee commuting",
  upstream_leased_assets: "Upstream leased assets",
  downstream_transport_distribution: "Downstream transport and distribution",
  processing_sold_products: "Processing of sold products",
  use_sold_products: "Use of sold products",
  end_of_life_sold_products: "End-of-life treatment of sold products",
  downstream_leased_assets: "Downstream leased assets",
  franchises: "Franchises",
  investments: "Investments",
};

function parseNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(/%/g, "")
    .replace(",", ".");

  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function normalizeRecord(record) {
  return {
    entity: record.entity?.trim() || "Unnamed entity",
    totalEmissions: parseNumber(record.total_emissions),
    scope1: parseNumber(record.total_scope_1),
    scope2: parseNumber(record.total_scope_2),
    scope3: parseNumber(record.total_scope_3),
    raw: record,
  };
}

function percentage(value, total) {
  if (!total) {
    return 0;
  }

  return (value / total) * 100;
}

function sumRows(rows, key) {
  return rows.reduce((sum, row) => sum + row[key], 0);
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
  const sites = normalizedRows.filter(
    (row) => row.entity.toLowerCase() !== "total empresa",
  );

  const total = totalRow ?? {
    entity: "Total empresa",
    totalEmissions: sumRows(sites, "totalEmissions"),
    scope1: sumRows(sites, "scope1"),
    scope2: sumRows(sites, "scope2"),
    scope3: sumRows(sites, "scope3"),
    raw: {},
  };

  const scopeBreakdown = [
    { label: "Scope 1", value: total.scope1, percentage: percentage(total.scope1, total.totalEmissions) },
    { label: "Scope 2", value: total.scope2, percentage: percentage(total.scope2, total.totalEmissions) },
    { label: "Scope 3", value: total.scope3, percentage: percentage(total.scope3, total.totalEmissions) },
  ];

  const topScope3Categories = Object.entries(SCOPE_3_LABELS)
    .map(([key, label]) => ({
      key,
      label,
      value: parseNumber(total.raw[key]),
    }))
    .map((category) => {
      if (category.value !== 0) {
        return category;
      }

      return {
        ...category,
        value: sites.reduce((sum, site) => sum + parseNumber(site.raw[category.key]), 0),
      };
    })
    .filter((category) => category.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    fileName,
    clientName: "RELATS S.A.U.",
    reportTitle: "Organisational Carbon Footprint Report 2024",
    totalSource: totalRow ? "official" : "calculated",
    total,
    sites,
    allRows: normalizedRows,
    scopeBreakdown,
    topScope3Categories,
  };
}
