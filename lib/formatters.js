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
