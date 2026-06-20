export function formatNumber(value, options = {}) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 2,
    ...options,
  }).format(value || 0);
}

export function formatTonnes(value) {
  return `${formatNumber(value)} tCO2e`;
}

export function formatPercent(value) {
  return `${formatNumber(value, { maximumFractionDigits: 1 })}%`;
}

// Choose a single emission unit for a whole report based on its largest value,
// so figures stay readable (e.g. 5,046,437 tCO2e -> 5.05 MtCO2e) and consistent
// across every table, KPI and chart in the same document.
export function pickEmissionUnit(maxValue) {
  const value = Math.abs(Number(maxValue) || 0);

  // Cap at kilotonnes so detailed sub-category values stay visible instead of
  // rounding to "0" — kt is also the convention used in the Relats sample reports.
  if (value >= 1_000) {
    return { divisor: 1_000, suffix: "ktCO2e" };
  }

  return { divisor: 1, suffix: "tCO2e" };
}

const DEFAULT_UNIT = { divisor: 1, suffix: "tCO2e" };

export function formatEmissions(value, unit = DEFAULT_UNIT) {
  const safeUnit = unit && unit.divisor ? unit : DEFAULT_UNIT;
  return `${formatNumber((value || 0) / safeUnit.divisor)} ${safeUnit.suffix}`;
}
