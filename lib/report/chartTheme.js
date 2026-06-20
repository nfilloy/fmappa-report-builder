/*
  Shared chart palette so recharts visuals match the CSS design tokens
  defined in app/globals.css (Mappa brand colours).
*/
export const BRAND = {
  navy: "#041282",
  peach: "#fca65e",
  coral: "#ff7983",
  pink: "#fdc2d8",
  teal: "#4b4fd6",
};

// Scope 1 / Scope 2 / Scope 3 colours, in order.
export const SCOPE_COLORS = [BRAND.navy, BRAND.peach, BRAND.coral];

// PCF lifecycle stage colours (Materials → End-of-life), six in order.
export const LIFECYCLE_COLORS = [
  BRAND.navy,
  BRAND.teal,
  "#5560c2",
  BRAND.peach,
  BRAND.coral,
  BRAND.pink,
];

// Sequential palette used for ranked bar charts (sites, Scope 3 hotspots).
export const SEQUENTIAL_COLORS = [
  BRAND.navy,
  "#2a37a0",
  "#5560c2",
  BRAND.teal,
  BRAND.peach,
  BRAND.coral,
  BRAND.pink,
];

export const CHART_GRID = "#e0e4eb";
export const CHART_AXIS = "#5c5f70";
