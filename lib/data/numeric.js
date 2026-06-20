// Shared numeric helpers for the OCF and PCF data layers.

export function parseNumber(value) {
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

export function percentage(value, total) {
  if (!total) {
    return 0;
  }

  return (value / total) * 100;
}

export function sumBy(rows, getter) {
  return rows.reduce((sum, row) => sum + getter(row), 0);
}
