import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildOcfReport } from "../lib/data/ocf.js";
import { buildPcfReport } from "../lib/data/pcf.js";
import { parseCsv } from "../lib/data/parseCsv.js";
import {
  applyPreset,
  buildReportSections,
  buildReportTitle,
  getSectionPresets,
  regenerateSectionContent,
} from "../lib/report/sections.js";

const RELATS_PATTERN = /relats/i;

function enabledIdSet(sections) {
  return new Set(
    sections.filter((section) => section.enabled).map((section) => section.id),
  );
}

function allContent(sections) {
  return sections.map((section) => section.content).join("\n");
}

test("derives the report title from kind + year", () => {
  assert.equal(
    buildReportTitle("ocf", "2027"),
    "Organisational Carbon Footprint Report 2027",
  );
  assert.equal(
    buildReportTitle("pcf", "2030"),
    "Products Carbon Footprint Report 2030",
  );
  // Falls back to the default year when none is provided.
  assert.equal(
    buildReportTitle("ocf"),
    "Organisational Carbon Footprint Report 2024",
  );
});

test("buildReportSections(report) reproduces the Relats/2024 sample copy", () => {
  const csv = readFileSync("data/sample_ocf_iso_14064.csv", "utf8");
  const sections = buildReportSections(
    buildOcfReport(parseCsv(csv), "sample_ocf_iso_14064.csv"),
  );
  const text = allContent(sections);

  // With the default metadata the sample stays Relats / 2024.
  assert.ok(text.includes("RELATS S.A.U."));
  assert.ok(text.includes("2024"));
  // The cross-references are present in the full report.
  assert.ok(text.includes("largest single site contributor"));
  // But the sample-data meta-commentary is gone for every client.
  assert.ok(!text.includes("illustrative sample data"));
});

test("a non-Relats OCF Executive brief produces a fully generic report", () => {
  const csv = readFileSync("data/sample_ocf_iso_14064.csv", "utf8");
  const report = buildOcfReport(parseCsv(csv), "sample_ocf_iso_14064.csv");

  const meta = {
    clientName: "ACME Corp",
    reportYear: "2027",
    dataSources: ["DEFRA", "ecoinvent"],
  };

  // Apply the Executive brief, then build the copy for that section set.
  const presetSections = applyPreset(buildReportSections(report), "executive", "ocf");
  const sections = regenerateSectionContent(presetSections, report, {
    ...meta,
    enabledIds: enabledIdSet(presetSections),
  });
  const text = allContent(sections);

  // No client-specific or hardcoded-year leakage.
  assert.ok(!RELATS_PATTERN.test(text), "should not mention Relats");
  assert.ok(!text.includes("2024"), "should not mention 2024");
  assert.ok(text.includes("ACME Corp"));
  assert.ok(text.includes("2027"));

  // Methodology shows only the configured sources.
  const methodology = sections.find((s) => s.id === "methodology").content;
  assert.ok(methodology.includes("DEFRA"));
  assert.ok(methodology.includes("ecoinvent"));
  assert.ok(!methodology.includes("EXIOBASE"));
  assert.ok(!methodology.includes("OCCC"));

  // The brief excludes site / category sections, so the exec summary and key
  // insights must not reference them.
  const execSummary = sections.find((s) => s.id === "executive-summary").content;
  const keyInsights = sections.find((s) => s.id === "key-insights").content;
  assert.ok(!execSummary.includes("largest single site contributor"));
  assert.ok(!execSummary.includes("most material Scope 3 category"));
  assert.ok(!keyInsights.includes("largest site contributor"));
  assert.ok(!keyInsights.includes("largest Scope 3 category"));

  // No internal meta-commentary in the deliverable.
  assert.ok(!text.includes("illustrative sample data"));
});

test("a non-Relats PCF report drops the Relats business-model claims", () => {
  const csv = readFileSync("data/sample_pcf_iso_14067.csv", "utf8");
  const report = buildPcfReport(parseCsv(csv), "sample_pcf_iso_14067.csv", {
    boundary: "cradle-to-gate",
  });

  const sections = buildReportSections(report, {
    clientName: "ACME Corp",
    reportYear: "2027",
    dataSources: ["DEFRA", "ecoinvent"],
  });
  const text = allContent(sections);

  assert.ok(!RELATS_PATTERN.test(text), "should not mention Relats");
  assert.ok(!text.includes("2024"), "should not mention 2024");
  assert.ok(!text.includes("intermediate components"));
  assert.ok(!text.includes("illustrative sample data"));
  assert.ok(text.includes("ACME Corp"));
  assert.ok(text.includes("2027"));

  const methodology = sections.find((s) => s.id === "methodology").content;
  assert.ok(methodology.includes("DEFRA"));
  assert.ok(methodology.includes("ecoinvent"));
  assert.ok(!methodology.includes("EXIOBASE"));
});

test("regenerateSectionContent preserves manually edited (dirty) sections", () => {
  const csv = readFileSync("data/sample_ocf_iso_14064.csv", "utf8");
  const report = buildOcfReport(parseCsv(csv), "sample_ocf_iso_14064.csv");
  const sections = buildReportSections(report).map((section) =>
    section.id === "introduction"
      ? { ...section, content: "My custom intro.", dirty: true }
      : section,
  );

  const regenerated = regenerateSectionContent(sections, report, {
    clientName: "ACME Corp",
    reportYear: "2027",
  });

  const intro = regenerated.find((s) => s.id === "introduction");
  const execSummary = regenerated.find((s) => s.id === "executive-summary");
  // Dirty section kept verbatim.
  assert.equal(intro.content, "My custom intro.");
  // Untouched section regenerated with the new metadata.
  assert.ok(execSummary.content.includes("ACME Corp"));
  assert.ok(execSummary.content.includes("2027"));
});

test("the Executive brief preset exists for both kinds", () => {
  assert.ok(getSectionPresets("ocf").executive);
  assert.ok(getSectionPresets("pcf").executive);
});
