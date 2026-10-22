/**
 * Recharts needs literal colour strings, so the admin charts read their palette from here
 * instead of scattering hex values through components.
 *
 * Every value mirrors a design token in src/app/globals.css (named in the comment beside it).
 * If a token changes there, update it here too.
 *
 * The order-status ramp is an ORDINAL one-hue green (later lifecycle stage = darker) plus the
 * brand error red for cancelled. It was checked with the dataviz skill's ordinal validator
 * (`validate_palette.js --ordinal --surface "#fcfcf9"`): monotone lightness, every step
 * ΔL ≥ 0.06, lightest step 2.01:1 on the glass chart surface, single hue. Status is always
 * paired with a text label in the legend, never colour alone.
 */
export const CHART_COLORS = {
  /** revenue bars — --color-leaf */
  bar: "#4a7c2e",
  /** bar hover wash — --color-canopy at 7% */
  barCursor: "rgba(43, 76, 31, 0.07)",
  /** hairline, solid gridlines — --color-border */
  grid: "#e4dcc8",
  /** axis tick text — --color-stone */
  axisText: "#5b5b4f",
  /** tooltip text — --color-ink */
  ink: "#2a2a22",
} as const;

export const ORDER_STATUS_CHART_COLORS = {
  /** order placed — lightest step of the ramp */
  Pending: "#9dbf7d",
  Confirmed: "#74a050",
  /** --color-leaf */
  Processing: "#4a7c2e",
  /** --color-canopy */
  Delivered: "#2b4c1f",
  /** --color-error */
  Cancelled: "#b2432a",
} as const;
