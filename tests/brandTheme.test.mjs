import assert from "node:assert/strict";
import test from "node:test";

import { buildBrandTheme } from "../lib/report/brandTheme.js";
import { contrastRatio } from "../lib/color/contrast.js";

test("defaults to Mappa navy when there is no accent or logo", () => {
  const brand = buildBrandTheme({});
  assert.equal(brand.accent, "#041282");
  assert.equal(brand.onAccent, "#ffffff");
  assert.equal(brand.source, "mappa");
});

test("keeps a manual accent and reports its source", () => {
  const brand = buildBrandTheme({ accentColor: "#b91c1c", accentSource: "manual" });
  assert.equal(brand.accent, "#b91c1c");
  assert.equal(brand.onAccent, "#ffffff");
  assert.equal(brand.source, "manual");
});

test("marks a logo-derived accent with the logo source", () => {
  const brand = buildBrandTheme({ accentColor: "#2e7d32", accentSource: "logo" });
  assert.equal(brand.source, "logo");
});

test("darkens a pale accent so it stays legible on white", () => {
  const brand = buildBrandTheme({ accentColor: "#f2e9d8", accentSource: "logo" });
  assert.ok(
    contrastRatio(brand.accent, "#ffffff") >= 3,
    "accent must be legible on the white report page",
  );
});

test("picks dark text on a light accent", () => {
  const brand = buildBrandTheme({ accentColor: "#fca65e", accentSource: "manual" });
  assert.equal(brand.onAccent, "#18181b");
});

test("falls back to Mappa navy for an invalid accent", () => {
  const brand = buildBrandTheme({ accentColor: "not-a-color" });
  assert.equal(brand.accent, "#041282");
  assert.equal(brand.source, "mappa");
});
