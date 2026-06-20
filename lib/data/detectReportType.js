import { buildOcfReport } from "./ocf.js";
import { buildPcfReport } from "./pcf.js";

// Inspect the parsed CSV headers to decide which footprint domain it belongs to.
// OCF rows expose organisational scope columns; PCF rows expose product columns.
export function detectReportType(rows) {
  if (!rows.length) {
    return null;
  }

  const columns = new Set(Object.keys(rows[0]));

  if (columns.has("entity") && columns.has("total_scope_1")) {
    return "ocf";
  }

  if (columns.has("product") && columns.has("functional_unit")) {
    return "pcf";
  }

  return null;
}

export function buildReport(rows, fileName = "Uploaded CSV") {
  const kind = detectReportType(rows);

  if (kind === "ocf") {
    return buildOcfReport(rows, fileName);
  }

  if (kind === "pcf") {
    return buildPcfReport(rows, fileName);
  }

  throw new Error(
    "Unrecognised CSV format. Expected an OCF dataset (entity, total_scope_*) or a PCF dataset (product, functional_unit).",
  );
}
