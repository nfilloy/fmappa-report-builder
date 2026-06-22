import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildPcfReport } from "../lib/data/pcf.js";
import { buildReport, detectReportType } from "../lib/data/detectReportType.js";
import { parseCsv } from "../lib/data/parseCsv.js";
import { buildReportSections } from "../lib/report/sections.js";

test("builds the PCF model from the provided sample CSV (cradle-to-gate)", () => {
  const csv = readFileSync("data/sample_pcf_iso_14067.csv", "utf8");
  const report = buildPcfReport(parseCsv(csv), "sample_pcf_iso_14067.csv");

  assert.equal(report.kind, "pcf");
  assert.equal(report.boundaryBasis, "cradle-to-gate");
  assert.equal(report.entities.length, 6);
  assert.equal(report.entities[0].name, "Botella PET 500ml");
  // Reported total is the in-boundary (materials + manufacturing + transport)
  // sum, not the CSV's cradle-to-grave total_emissions (573.045).
  assert.ok(Math.abs(report.total.totalEmissions - 298.818) < 1e-3);
  assert.ok(Math.abs(report.cradleToGraveTotal - 573.045) < 1e-3);

  // Only the three in-boundary stages drive the breakdown.
  assert.equal(report.breakdown.length, 3);
  assert.equal(report.entityColumns.length, 3);
  assert.deepEqual(
    report.breakdown.map((item) => item.label),
    ["Materials", "Manufacturing", "Transport"],
  );
  // In-boundary percentages sum to ~100%.
  const totalPercentage = report.breakdown.reduce(
    (sum, item) => sum + item.percentage,
    0,
  );
  assert.ok(Math.abs(totalPercentage - 100) < 1e-6);

  // Downstream stages are reported out of boundary, not in the footprint.
  assert.deepEqual(
    report.excludedStages.map((stage) => stage.label),
    ["Distribution", "Use", "End of life"],
  );
  assert.ok(report.excludedTotal > 0);
  // No excluded stage leaks into the hotspots.
  const hotspotKeys = report.topCategories.map((category) => category.key);
  assert.ok(!hotspotKeys.some((key) => /^(4_|5_|6_)/.test(key)));
});

test("reports the in-boundary per-product total for cradle-to-gate", () => {
  const csv = readFileSync("data/sample_pcf_iso_14067.csv", "utf8");
  const report = buildPcfReport(parseCsv(csv), "sample_pcf_iso_14067.csv", {
    boundary: "cradle-to-gate",
  });

  const bottle = report.entities.find((e) => e.name === "Botella PET 500ml");
  // 27.781 + 16.29 + 20.45
  assert.ok(Math.abs(bottle.totalEmissions - 64.521) < 1e-3);
  assert.ok(report.excludedStages.length > 0);
});

test("builds the full life cycle under cradle-to-grave", () => {
  const csv = readFileSync("data/sample_pcf_iso_14067.csv", "utf8");
  const report = buildPcfReport(parseCsv(csv), "sample_pcf_iso_14067.csv", {
    boundary: "cradle-to-grave",
  });

  assert.equal(report.boundaryBasis, "cradle-to-grave");
  // All six stages drive the breakdown; nothing is excluded.
  assert.equal(report.breakdown.length, 6);
  assert.equal(report.entityColumns.length, 6);
  assert.equal(report.excludedStages.length, 0);
  assert.equal(report.excludedTotal, 0);
  assert.equal(report.excludedStagesNote, "");

  const bottle = report.entities.find((e) => e.name === "Botella PET 500ml");
  // 27.781 + 16.29 + 20.45 + 3.201 + 37.345 + 2.008 = 107.075 (= total_emissions)
  assert.ok(Math.abs(bottle.totalEmissions - 107.075) < 1e-3);
  // The reported total now equals the cradle-to-grave total.
  assert.ok(
    Math.abs(report.total.totalEmissions - report.cradleToGraveTotal) < 1e-6,
  );

  // In-boundary percentages still sum to ~100%.
  const totalPercentage = report.breakdown.reduce(
    (sum, item) => sum + item.percentage,
    0,
  );
  assert.ok(Math.abs(totalPercentage - 100) < 1e-6);
});

test("section copy reflects the selected boundary", () => {
  const csv = readFileSync("data/sample_pcf_iso_14067.csv", "utf8");
  const rows = parseCsv(csv);

  const gate = buildReportSections(
    buildPcfReport(rows, "sample.csv", { boundary: "cradle-to-gate" }),
  );
  const grave = buildReportSections(
    buildPcfReport(rows, "sample.csv", { boundary: "cradle-to-grave" }),
  );

  const methodologyText = (sections) =>
    sections.find((s) => s.id === "methodology").content;
  const globalResultsText = (sections) =>
    sections.find((s) => s.id === "global-results").content;

  assert.ok(methodologyText(gate).includes("cradle-to-gate"));
  assert.ok(methodologyText(grave).includes("cradle-to-grave"));
  assert.ok(!methodologyText(grave).includes("intermediate components"));

  // The comparative-portfolio caveat must remain in BOTH modes.
  assert.ok(globalResultsText(gate).includes("comparative portfolio sum"));
  assert.ok(globalResultsText(grave).includes("comparative portfolio sum"));
});

test("rejects CSV files missing the required PCF columns", () => {
  const csv = "product,total_emissions\nBottle,100";

  assert.throws(
    () => buildPcfReport(parseCsv(csv), "invalid.csv"),
    /Missing required columns: functional_unit/,
  );
});

test("detects the report type from CSV headers", () => {
  const ocfCsv = readFileSync("data/sample_ocf_iso_14064.csv", "utf8");
  const pcfCsv = readFileSync("data/sample_pcf_iso_14067.csv", "utf8");

  assert.equal(detectReportType(parseCsv(ocfCsv)), "ocf");
  assert.equal(detectReportType(parseCsv(pcfCsv)), "pcf");
  assert.equal(detectReportType(parseCsv("foo,bar\n1,2")), null);
});

test("buildReport dispatches to the correct domain and throws on unknown CSV", () => {
  const pcfCsv = readFileSync("data/sample_pcf_iso_14067.csv", "utf8");
  const report = buildReport(parseCsv(pcfCsv), "sample_pcf_iso_14067.csv");

  assert.equal(report.kind, "pcf");
  assert.throws(
    () => buildReport(parseCsv("foo,bar\n1,2"), "invalid.csv"),
    /Unrecognised CSV format/,
  );
});

test("builds PCF report sections with lifecycle-specific ids", () => {
  const csv = readFileSync("data/sample_pcf_iso_14067.csv", "utf8");
  const report = buildPcfReport(parseCsv(csv), "sample_pcf_iso_14067.csv");
  const sections = buildReportSections(report);

  const ids = sections.map((section) => section.id);
  assert.ok(ids.includes("introduction"));
  assert.ok(ids.includes("lifecycle-breakdown"));
  assert.ok(ids.includes("product-results"));
  assert.ok(ids.includes("lifecycle-analysis"));
  assert.ok(ids.includes("strategic-recommendations"));
  assert.ok(sections.some((section) => section.type === "narrative-analysis"));
  assert.ok(sections.some((section) => section.type === "recommendations"));
  assert.ok(sections.every((section) => section.enabled));
});
