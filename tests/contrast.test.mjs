import assert from "node:assert/strict";
import test from "node:test";

import {
  bestTextOn,
  contrastRatio,
  ensureReadable,
} from "../lib/color/contrast.js";

test("contrastRatio matches known WCAG values", () => {
  // Black on white is the maximum 21:1.
  assert.equal(Math.round(contrastRatio("#000000", "#ffffff")), 21);
  // Same colour is 1:1.
  assert.equal(contrastRatio("#abcdef", "#abcdef"), 1);
  // Order does not matter.
  assert.equal(
    contrastRatio("#041282", "#ffffff"),
    contrastRatio("#ffffff", "#041282"),
  );
});

test("bestTextOn picks readable text for light and dark backgrounds", () => {
  assert.equal(bestTextOn("#ffffff"), "#18181b");
  assert.equal(bestTextOn("#041282"), "#ffffff");
  assert.equal(bestTextOn("#fdc2d8"), "#18181b");
});

test("ensureReadable darkens pale colours until legible on white", () => {
  const pale = "#f2e9d8";
  assert.ok(contrastRatio(pale, "#ffffff") < 3, "fixture should start illegible");

  const fixed = ensureReadable(pale, { against: "#ffffff", min: 3 });
  assert.ok(
    contrastRatio(fixed, "#ffffff") >= 3,
    "result must meet the minimum contrast",
  );
});

test("ensureReadable leaves already-legible colours untouched", () => {
  assert.equal(ensureReadable("#041282", { against: "#ffffff", min: 3 }), "#041282");
});
