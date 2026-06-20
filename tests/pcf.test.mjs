import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildPcfReport } from "../lib/data/pcf.js";
import { buildReport, detectReportType } from "../lib/data/detectReportType.js";
import { parseCsv } from "../lib/data/parseCsv.js";
import { buildReportSections } from "../lib/report/sections.js";

test("builds the PCF model from the provided sample CSV", () => {
  const csv = readFileSync("data/sample_pcf_iso_14067.csv", "utf8");
  const report = buildPcfReport(parseCsv(csv), "sample_pcf_iso_14067.csv");

  assert.equal(report.kind, "pcf");
  assert.equal(report.entities.length, 6);
  assert.equal(report.entities[0].name, "Botella PET 500ml");
  assert.ok(Math.abs(report.total.totalEmissions - 573.045) < 1e-6);
  assert.equal(report.breakdown.length, 6);
  assert.equal(report.entityColumns.length, 6);
  assert.deepEqual(
    report.breakdown.map((item) => item.label),
    ["Materials", "Manufacturing", "Transport", "Distribution", "Use", "End of life"],
  );
  // Lifecycle percentages sum to ~100%.
  const totalPercentage = report.breakdown.reduce(
    (sum, item) => sum + item.percentage,
    0,
  );
  assert.ok(Math.abs(totalPercentage - 100) < 1e-6);
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
  assert.ok(ids.includes("lifecycle-breakdown"));
  assert.ok(ids.includes("product-results"));
  assert.ok(sections.every((section) => section.enabled));
});
