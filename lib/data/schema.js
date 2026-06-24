// Bounded column-mapping support for the two known schemas (OCF / PCF). This is
// NOT a generic arbitrary-CSV engine: it only remaps an uploaded CSV onto one of
// the two known schemas, and only when normal validation fails.

import { OCF_CATEGORY_GROUPS, OCF_REQUIRED_COLUMNS } from "./ocf.js";
import { PCF_REQUIRED_COLUMNS, PCF_STAGE_GROUPS } from "./pcf.js";

// Required (must-be-mapped) fields per schema. These mirror each domain's
// validation requirements, so a CSV remapped onto every required field will
// validate.
export const SCHEMA_REQUIRED_FIELDS = {
  ocf: OCF_REQUIRED_COLUMNS,
  pcf: PCF_REQUIRED_COLUMNS,
};

const OCF_CATEGORY_COLUMNS = OCF_CATEGORY_GROUPS.flatMap((group) =>
  group.categories.map(([key]) => key),
);
const PCF_CATEGORY_COLUMNS = PCF_STAGE_GROUPS.flatMap((group) =>
  group.categories.map(([key]) => key),
);

// The full set of canonical columns each schema understands. Anything outside
// this list is ignored by the model; detail columns are auto-matched by exact
// header name (the mapping UI only asks the user about the required fields).
export const SCHEMA_KNOWN_COLUMNS = {
  ocf: [...SCHEMA_REQUIRED_FIELDS.ocf, ...OCF_CATEGORY_COLUMNS],
  pcf: [
    ...SCHEMA_REQUIRED_FIELDS.pcf,
    "total_distribution",
    "total_use",
    "total_end_of_life",
    ...PCF_CATEGORY_COLUMNS,
  ],
};

// The optional (detail) columns each schema understands: every known column
// that is not required, in canonical order. These are auto-matched by exact
// header name, but the mapping UI also lets the user remap a renamed one.
export const SCHEMA_OPTIONAL_FIELDS = {
  ocf: SCHEMA_KNOWN_COLUMNS.ocf.filter(
    (column) => !SCHEMA_REQUIRED_FIELDS.ocf.includes(column),
  ),
  pcf: SCHEMA_KNOWN_COLUMNS.pcf.filter(
    (column) => !SCHEMA_REQUIRED_FIELDS.pcf.includes(column),
  ),
};

export const SCHEMA_LABELS = {
  ocf: "OCF (organisational)",
  pcf: "PCF (product)",
};

// Pre-select an exact / case-insensitive header match for each field in
// `fields`. Returns a mapping `{ field: csvColumn | "" }`.
export function suggestFieldMapping(fields, csvColumns) {
  const byLower = new Map(
    (csvColumns || []).map((column) => [String(column).trim().toLowerCase(), column]),
  );

  return (fields || []).reduce((mapping, field) => {
    mapping[field] = byLower.get(field.toLowerCase()) ?? "";
    return mapping;
  }, {});
}

// Pre-select matches for a known schema's required fields (back-compat helper).
export function suggestColumnMapping(kind, csvColumns) {
  return suggestFieldMapping(SCHEMA_REQUIRED_FIELDS[kind] ?? [], csvColumns);
}

// Re-key the uploaded rows onto canonical column names per `mapping`
// (`{ canonicalField: sourceColumn }`). Source columns are renamed to their
// canonical key; an empty/missing source is skipped (validation will catch it).
// Original keys are preserved so detail columns already named canonically are
// auto-matched by exact header name.
export function applyColumnMapping(rows, mapping) {
  const entries = Object.entries(mapping || {}).filter(([, source]) => source);

  return (rows || []).map((row) => {
    const next = { ...row };
    for (const [canonical, source] of entries) {
      next[canonical] = row[source];
    }
    return next;
  });
}
