// Status palette — reserved for state/severity, never reused as an arbitrary
// categorical series color. Validated: CVD (protan) separation dE 9.0,
// normal-vision floor dE 20.0 (node scripts/validate_palette.js).
export const STATUS_COLORS = {
  good: "#1a9c4b",
  warning: "#e8a33d",
  serious: "#e2733f",
  critical: "#d6483f",
  neutral: "#9a9a9a",
} as const;

// Categorical palette slots (fixed order) — for genuine identity encoding
// (e.g. Team), never reordered when a filter changes the visible set.
export const CATEGORICAL_COLORS = ["#2f6fed", "#eb6834", "#0fa3a3", "#eda100"] as const;

export const TEAM_COLORS: Record<string, string> = {
  RCIS: CATEGORICAL_COLORS[0],
  "NON RCIS": CATEGORICAL_COLORS[1],
  "Shared Services": CATEGORICAL_COLORS[2],
  "WAM ITOT": CATEGORICAL_COLORS[3],
};

export const HEALTH_COLORS: Record<string, string> = {
  Green: STATUS_COLORS.good,
  Amber: STATUS_COLORS.warning,
  Red: STATUS_COLORS.critical,
  "No Data": STATUS_COLORS.neutral,
};

export const CHANGE_STATUS_COLORS: Record<string, string> = {
  Success: STATUS_COLORS.good,
  Failure: STATUS_COLORS.critical,
  WIP: STATUS_COLORS.warning,
};

export const FOUR_EYE_COLORS: Record<string, string> = {
  Completed: STATUS_COLORS.good,
  "Not Completed": STATUS_COLORS.critical,
  WIP: STATUS_COLORS.warning,
};

export const RUN_STATUS_COLORS: Record<string, string> = {
  Success: STATUS_COLORS.good,
  Failure: STATUS_COLORS.critical,
  "Yet to Run": STATUS_COLORS.warning,
};

export const URL_STATUS_COLORS: Record<string, string> = {
  Operational: STATUS_COLORS.good,
  "Non Operational": STATUS_COLORS.critical,
};

// Medal tags are metaphorical UI badges (not chart-series encoding), so the
// literal metallic hues are intentionally used and kept visually distinct
// from the status palette above — and from each other (Silver vs Tin).
export const MEDAL_COLORS: Record<string, string> = {
  Gold: "#c9971f",
  Silver: "#8c96a3",
  Bronze: "#a8703a",
  Tin: "#5b6570",
};
