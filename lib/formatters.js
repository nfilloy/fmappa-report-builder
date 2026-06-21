export function formatNumber(value, options = {}) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 2,
    ...options,
  }).format(value || 0);
}

export function formatTonnes(value) {
  return `${formatNumber(value)} tCO₂e`;
}

export function formatPercent(value) {
  // Always one decimal so percentages read consistently (e.g. "6.0%", never "6%").
  return `${formatNumber(value, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

// Emission unit conventions, declared per report type. Each report uses ONE
// unit for every figure (KPI, table, chart) so the document stays internally
// consistent, picked from the report's largest value via `pickEmissionUnit`.
//
// Input unit (assumption documented in the methodology section and the README):
//   OCF — activity data is provided in kgCO2e. Organisational footprints are
//         reported in tonnes (tCO2e), scaling to kilotonnes (ktCO2e) only for
//         very large multi-site totals. This keeps sub-category values visible.
//   PCF — activity data is provided in gCO2e per functional unit. Product
//         footprints are reported in grams (gCO2e), scaling to kilograms
//         (kgCO2e) for larger products. Product emissions are never in tonnes.
//
// `divisor` converts the raw CSV value into the displayed unit; scales are
// ordered from largest to smallest and the first whose `min` the value reaches
// (compared in raw CSV units) is selected.
const EMISSION_UNIT_SCALES = {
  ocf: [
    { min: 1_000_000_000, divisor: 1_000_000, suffix: "ktCO₂e" },
    { min: 0, divisor: 1_000, suffix: "tCO₂e" },
  ],
  pcf: [
    { min: 1_000_000, divisor: 1_000_000, suffix: "tCO₂e" },
    { min: 1_000, divisor: 1_000, suffix: "kgCO₂e" },
    { min: 0, divisor: 1, suffix: "gCO₂e" },
  ],
};

export function pickEmissionUnit(maxValue, kind = "ocf") {
  const value = Math.abs(Number(maxValue) || 0);
  const scales = EMISSION_UNIT_SCALES[kind] ?? EMISSION_UNIT_SCALES.ocf;

  return (
    scales.find((scale) => value >= scale.min) ?? scales[scales.length - 1]
  );
}

const DEFAULT_UNIT = { divisor: 1, suffix: "tCO₂e" };

export function formatEmissions(value, unit = DEFAULT_UNIT) {
  const safeUnit = unit && unit.divisor ? unit : DEFAULT_UNIT;
  // Always two decimals so every emission figure aligns (e.g. "364.50", "119.00").
  return `${formatNumber((value || 0) / safeUnit.divisor, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${safeUnit.suffix}`;
}
