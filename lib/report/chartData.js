export function percentageOfMax(value, maxValue) {
  if (!Number.isFinite(value) || !Number.isFinite(maxValue) || maxValue <= 0) {
    return 0;
  }

  return Math.max(0, Math.min((value / maxValue) * 100, 100));
}

export function maxByValue(items, valueKey) {
  return items.reduce((maxValue, item) => {
    const value = Number(item?.[valueKey]) || 0;
    return Math.max(maxValue, value);
  }, 0);
}
