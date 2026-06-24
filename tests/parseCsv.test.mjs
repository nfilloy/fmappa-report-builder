import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { parseCsv } from "../lib/data/parseCsv.js";
import { parseNumber } from "../lib/data/numeric.js";
import { buildOcfReport } from "../lib/data/ocf.js";

// Compare records by treating numeric-looking values as numbers, so the same
// data expressed with dot decimals (comma/tab files) or comma decimals
// (semicolon files) compares equal.
function numify(records) {
  return records.map((record) =>
    Object.fromEntries(
      Object.entries(record).map(([key, value]) => {
        const trimmed = String(value).trim();
        if (trimmed === "") {
          return [key, value];
        }
        const parsed = parseNumber(value);
        // Only treat as numeric when the original was actually a number.
        return [key, parsed !== 0 || /^[-+]?0([.,]0+)?$/.test(trimmed) ? parsed : value];
      }),
    ),
  );
}

test("comma-delimited CSV parses as before (sample OCF regression)", () => {
  const records = parseCsv(readFileSync("data/sample_ocf_iso_14064.csv", "utf8"));

  assert.equal(records.length, 4);
  assert.equal(records[0].entity, "Planta Barcelona");
  assert.equal(records[0].total_emissions, "1391109.61");
  assert.equal(Object.keys(records[0]).length, 29);
});

test("semicolon-delimited data parses to the same values as the comma version", () => {
  const commaCsv = ["a,b,c", "x,27.781,3.2", "y,1.5,4", "z,0,10"].join("\n");
  const semiCsv = ["a;b;c", "x;27,781;3,2", "y;1,5;4", "z;0;10"].join("\n");

  const comma = parseCsv(commaCsv);
  const semi = parseCsv(semiCsv);

  // Same shape and keys.
  assert.deepEqual(Object.keys(semi[0]), ["a", "b", "c"]);
  assert.equal(semi.length, comma.length);
  // Identical numeric values once decimals are interpreted.
  assert.deepEqual(numify(semi), numify(comma));
});

test("tab-delimited data parses identically to the comma version", () => {
  const commaCsv = ["a,b,c", "x,27.781,3.2", "y,1.5,4"].join("\n");
  const tabCsv = ["a\tb\tc", "x\t27.781\t3.2", "y\t1.5\t4"].join("\n");

  assert.deepEqual(parseCsv(tabCsv), parseCsv(commaCsv));
});

test("a quoted delimiter inside a field is kept as literal text", () => {
  const csv = ['name;note', '"A; still one";ok'].join("\n");
  const records = parseCsv(csv);

  assert.equal(records.length, 1);
  assert.deepEqual(Object.keys(records[0]), ["name", "note"]);
  assert.equal(records[0].name, "A; still one");
  assert.equal(records[0].note, "ok");
});

test("an explicit delimiter override skips detection", () => {
  // Header has more commas than semicolons, but we force ";".
  const csv = ["a,1;b;c", "x,y;z;w"].join("\n");
  const records = parseCsv(csv, { delimiter: ";" });

  assert.deepEqual(Object.keys(records[0]), ["a,1", "b", "c"]);
  assert.equal(records[0]["a,1"], "x,y");
});

test("a semicolon OCF file builds the same model as the comma sample", () => {
  const commaCsv = readFileSync("data/sample_ocf_iso_14064.csv", "utf8");
  // Convert to a European semicolon file: ; separators and comma decimals.
  const semiCsv = commaCsv.replace(/,/g, ";").replace(/\./g, ",");

  const fromComma = buildOcfReport(parseCsv(commaCsv), "comma.csv");
  const fromSemi = buildOcfReport(parseCsv(semiCsv), "semi.csv");

  assert.equal(
    fromSemi.total.totalEmissions,
    fromComma.total.totalEmissions,
  );
  assert.deepEqual(fromSemi.entities, fromComma.entities);
  assert.deepEqual(fromSemi.breakdown, fromComma.breakdown);
  assert.equal(fromSemi.warnings.length, 0);
});
