import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildOcfReport } from "../lib/data/ocf.js";
import { parseCsv } from "../lib/data/parseCsv.js";
import { maxByValue, percentageOfMax } from "../lib/report/chartData.js";
import {
  applyPreset,
  buildReportSections,
  createCustomSection,
  removeSection,
  reorderSection,
  updateSection,
} from "../lib/report/sections.js";

test("builds the OCF model from the provided sample CSV", () => {
  const csv = readFileSync("data/sample_ocf_iso_14064.csv", "utf8");
  const report = buildOcfReport(parseCsv(csv), "sample_ocf_iso_14064.csv");

  assert.equal(report.kind, "ocf");
  assert.equal(report.total.totalEmissions, 5046437.06);
  assert.deepEqual(
    report.entities.map((entity) => entity.name),
    ["Planta Barcelona", "Planta Valencia", "Planta Sevilla"],
  );
  assert.equal(report.categoryBreakdown.length, 3);
  assert.equal(
    report.topCategories[0].key,
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

test("updates editable section fields and can rebuild default sections", () => {
  const csv = readFileSync("data/sample_ocf_iso_14064.csv", "utf8");
  const report = buildOcfReport(parseCsv(csv), "sample_ocf_iso_14064.csv");
  const sections = buildReportSections(report);

  const edited = updateSection(sections, "global-results", {
    content: "Edited intro note.",
    title: "Edited results",
  });

  assert.equal(
    edited.find((section) => section.id === "global-results").title,
    "Edited results",
  );
  assert.equal(
    edited.find((section) => section.id === "global-results").content,
    "Edited intro note.",
  );
  assert.equal(
    sections.find((section) => section.id === "global-results").title,
    "Global results",
  );

  const restored = buildReportSections(report);

  assert.equal(
    restored.find((section) => section.id === "global-results").title,
    "Global results",
  );
  assert.notEqual(
    restored.find((section) => section.id === "global-results").content,
    "Edited intro note.",
  );
});

test("adds custom sections and only removes removable ones", () => {
  const csv = readFileSync("data/sample_ocf_iso_14064.csv", "utf8");
  const report = buildOcfReport(parseCsv(csv), "sample_ocf_iso_14064.csv");
  const sections = buildReportSections(report);

  const custom = createCustomSection(0);
  assert.equal(custom.removable, true);
  assert.equal(custom.type, "text");

  const withCustom = [...sections, custom];

  // Base sections cannot be removed.
  const afterBaseRemoval = removeSection(withCustom, "executive-summary");
  assert.equal(afterBaseRemoval.length, withCustom.length);

  // Custom sections can be removed.
  const afterCustomRemoval = removeSection(withCustom, custom.id);
  assert.equal(afterCustomRemoval.length, sections.length);
  assert.ok(!afterCustomRemoval.some((section) => section.id === custom.id));
});

test("applies a preset, ordering and toggling base sections while keeping custom", () => {
  const csv = readFileSync("data/sample_ocf_iso_14064.csv", "utf8");
  const report = buildOcfReport(parseCsv(csv), "sample_ocf_iso_14064.csv");
  const custom = createCustomSection(0);
  const sections = [...buildReportSections(report), custom];

  const executive = applyPreset(sections, "executive");

  const enabledIds = executive
    .filter((section) => section.enabled && !section.removable)
    .map((section) => section.id);
  assert.deepEqual(enabledIds, [
    "executive-summary",
    "global-results",
    "scope-breakdown",
    "key-insights",
  ]);

  // Sections outside the preset are kept but disabled.
  assert.equal(
    executive.find((section) => section.id === "methodology").enabled,
    false,
  );

  // Custom sections are preserved.
  assert.ok(executive.some((section) => section.id === custom.id));

  // Unknown preset returns the sections unchanged.
  assert.equal(applyPreset(sections, "unknown"), sections);
});

test("builds safe chart bar percentages", () => {
  assert.equal(percentageOfMax(50, 100), 50);
  assert.equal(percentageOfMax(200, 100), 100);
  assert.equal(percentageOfMax(10, 0), 0);
  assert.equal(percentageOfMax(Number.NaN, 100), 0);

  assert.equal(maxByValue([{ value: 12 }, { value: 4 }], "value"), 12);
  assert.equal(maxByValue([], "value"), 0);
});
