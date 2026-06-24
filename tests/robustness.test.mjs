import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildOcfReport } from "../lib/data/ocf.js";
import { buildPcfReport } from "../lib/data/pcf.js";
import { parseCsv } from "../lib/data/parseCsv.js";
import {
  applyColumnMapping,
  suggestColumnMapping,
} from "../lib/data/schema.js";

// --- A1: OCF total-row detection -------------------------------------------

test("detects an OCF total row labelled 'Total' (not double-counted)", () => {
  const csv = [
    "entity,total_emissions,total_scope_1,total_scope_2,total_scope_3",
    "Site A,100,10,20,70",
    "Site B,200,20,40,140",
    "Total,300,30,60,210",
  ].join("\n");

  const report = buildOcfReport(parseCsv(csv), "labelled-total.csv");

  assert.equal(report.totalSource, "official");
  assert.equal(report.total.totalEmissions, 300);
  // The total row is not rendered as a phantom plant.
  assert.deepEqual(
    report.entities.map((entity) => entity.name),
    ["Site A", "Site B"],
  );
});

test("detects an OCF total row structurally when the label is unknown", () => {
  const csv = [
    "entity,total_emissions,total_scope_1,total_scope_2,total_scope_3",
    "Site A,100,10,20,70",
    "Site B,200,20,40,140",
    "Consolidated,300,30,60,210",
  ].join("\n");

  const report = buildOcfReport(parseCsv(csv), "structural-total.csv");

  assert.equal(report.totalSource, "official");
  assert.equal(report.total.totalEmissions, 300);
  assert.deepEqual(
    report.entities.map((entity) => entity.name),
    ["Site A", "Site B"],
  );
});

test("computes the OCF total from sites when no total row exists", () => {
  const csv = [
    "entity,total_emissions,total_scope_1,total_scope_2,total_scope_3",
    "Site A,100,10,20,70",
    "Site B,200,20,40,140",
  ].join("\n");

  const report = buildOcfReport(parseCsv(csv), "no-total.csv");

  assert.equal(report.totalSource, "calculated");
  assert.equal(report.total.totalEmissions, 300);
  assert.equal(report.entities.length, 2);
});

// --- A2: malformed-number warnings -----------------------------------------

test("warns on non-empty unparseable cells but not on empty ones", () => {
  const csv = [
    "entity,total_emissions,total_scope_1,total_scope_2,total_scope_3",
    "Site A,100,10,20,bad",
    "Site B,,5,5,5",
  ].join("\n");

  const report = buildOcfReport(parseCsv(csv), "warnings.csv");

  // Exactly one warning: the "bad" cell. The empty total_emissions is silent.
  assert.equal(report.warnings.length, 1);
  assert.deepEqual(report.warnings[0], {
    row: "Site A",
    column: "total_scope_3",
    rawValue: "bad",
  });

  // The unparseable value is treated as 0.
  const siteA = report.entities.find((entity) => entity.name === "Site A");
  assert.equal(siteA.values.scope3, 0);
});

// --- A3: PCF stage-column validation ----------------------------------------

test("rejects a PCF CSV missing the in-boundary stage columns", () => {
  const csv = "product,functional_unit,total_emissions\nBottle,1 unit,100";

  assert.throws(
    () => buildPcfReport(parseCsv(csv), "missing-stages.csv"),
    /Missing required columns: total_materials, total_manufacturing, total_transport/,
  );
});

// --- B: column mapping ------------------------------------------------------

test("applyColumnMapping re-keys renamed columns and builds an identical report", () => {
  const csv = readFileSync("data/sample_ocf_iso_14064.csv", "utf8");
  const rows = parseCsv(csv);
  const canonical = buildOcfReport(rows, "sample.csv");

  // Simulate a CSV with renamed required headers.
  const renamed = rows.map((row) => {
    const { entity, total_scope_1, ...rest } = row;
    return { site: entity, s1: total_scope_1, ...rest };
  });

  const mapping = {
    entity: "site",
    total_emissions: "total_emissions",
    total_scope_1: "s1",
    total_scope_2: "total_scope_2",
    total_scope_3: "total_scope_3",
  };

  const mapped = buildOcfReport(applyColumnMapping(renamed, mapping), "sample.csv");

  assert.equal(mapped.total.totalEmissions, canonical.total.totalEmissions);
  assert.equal(mapped.totalSource, canonical.totalSource);
  assert.deepEqual(mapped.entities, canonical.entities);
  assert.deepEqual(mapped.breakdown, canonical.breakdown);
  assert.deepEqual(mapped.topCategories, canonical.topCategories);
});

test("applyColumnMapping remaps a renamed optional detail column (not 0)", () => {
  const csv = [
    "entity,total_emissions,total_scope_1,total_scope_2,total_scope_3,viajes",
    "Site A,100,10,20,70,70",
  ].join("\n");
  const rows = parseCsv(csv);

  // Unmapped: the renamed detail column is ignored → business travel stays 0.
  const unmapped = buildOcfReport(rows, "renamed-detail.csv");
  assert.ok(
    !unmapped.topCategories.some(
      (category) => category.key === "scope_3_6_business_travel",
    ),
  );

  // Mapping the optional column onto its canonical key flows the value through.
  const mapped = buildOcfReport(
    applyColumnMapping(rows, { scope_3_6_business_travel: "viajes" }),
    "renamed-detail.csv",
  );
  const businessTravel = mapped.topCategories.find(
    (category) => category.key === "scope_3_6_business_travel",
  );
  assert.ok(businessTravel);
  assert.equal(businessTravel.value, 70);
});

test("suggestColumnMapping pre-selects case-insensitive exact matches", () => {
  const mapping = suggestColumnMapping("ocf", [
    "Entity",
    "TOTAL_EMISSIONS",
    "scope1",
  ]);

  assert.equal(mapping.entity, "Entity");
  assert.equal(mapping.total_emissions, "TOTAL_EMISSIONS");
  // No match → left unmapped.
  assert.equal(mapping.total_scope_1, "");
});

// --- Verification #6: samples unchanged -------------------------------------

test("sample CSVs build with no warnings and an official total source", () => {
  const ocf = buildOcfReport(
    parseCsv(readFileSync("data/sample_ocf_iso_14064.csv", "utf8")),
    "sample_ocf_iso_14064.csv",
  );
  assert.equal(ocf.warnings.length, 0);
  assert.equal(ocf.totalSource, "official");
  assert.equal(ocf.total.totalEmissions, 5046437.06);

  const pcf = buildPcfReport(
    parseCsv(readFileSync("data/sample_pcf_iso_14067.csv", "utf8")),
    "sample_pcf_iso_14067.csv",
  );
  assert.equal(pcf.warnings.length, 0);
});
