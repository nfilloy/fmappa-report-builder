// Shared numeric helpers for the OCF and PCF data layers.

// Parses a CSV cell into a number, distinguishing a legitimately empty/blank
// cell (silent `0`) from a non-empty value that could not be read (also `0`, but
// flagged via `malformed` so callers can surface a warning). Ambiguous European
// thousands separators (e.g. "1.234,56") deliberately fail rather than being
// guessed at — the single-comma-decimal case is still handled.
export function parseNumberStrict(value) {
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? { value, malformed: false }
      : { value: 0, malformed: true };
  }

  const raw = String(value ?? "").trim();

  if (raw === "") {
    return { value: 0, malformed: false };
  }

  const normalized = raw
    .replace(/\s/g, "")
    .replace(/%/g, "")
    .replace(",", ".");

  const number = Number(normalized);
  return Number.isFinite(number)
    ? { value: number, malformed: false }
    : { value: 0, malformed: true };
}

export function parseNumber(value) {
  return parseNumberStrict(value).value;
}

export function percentage(value, total) {
  if (!total) {
    return 0;
  }

  return (value / total) * 100;
}

export function sumBy(rows, getter) {
  return rows.reduce((sum, row) => sum + getter(row), 0);
}
