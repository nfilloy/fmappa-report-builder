import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildOcfReport } from "../lib/data/ocf.js";
import { parseCsv } from "../lib/data/parseCsv.js";
import { buildReportSections, reorderSection } from "../lib/report/sections.js";

test("builds the OCF model from the provided sample CSV", () => {
  const csv = readFileSync("data/sample_ocf_iso_14064.csv", "utf8");
  const report = buildOcfReport(parseCsv(csv), "sample_ocf_iso_14064.csv");

  assert.equal(report.total.totalEmissions, 5046437.06);
  assert.deepEqual(
    report.sites.map((site) => site.entity),
    ["Planta Barcelona", "Planta Valencia", "Planta Sevilla"],
  );
  assert.equal(report.categoryBreakdown.length, 3);
  assert.equal(
    report.topScope3Categories[0].key,
    "scope_3_1_1_raw_materials_or_auxiliary_materials",
  );
});

test("rejects CSV files missing the required OCF columns", () => {
  const csv = "entity,total_emissions\nBarcelona,100";

  assert.throws(
    () => buildOcfReport(parseCsv(csv), "invalid.csv"),
    /Missing required columns: total_scope_1, total_scope_2, total_scope_3/,
  );
});

test("builds enabled report sections and reorders them", () => {
  const csv = readFileSync("data/sample_ocf_iso_14064.csv", "utf8");
  const report = buildOcfReport(parseCsv(csv), "sample_ocf_iso_14064.csv");
  const sections = buildReportSections(report);

  assert.ok(sections.length > 0);
  assert.ok(sections.every((section) => section.enabled));
  assert.equal(sections[0].id, "executive-summary");

  const reordered = reorderSection(sections, "methodology", "up");

  assert.equal(reordered[0].id, "methodology");
  assert.equal(reordered[1].id, "executive-summary");
});
