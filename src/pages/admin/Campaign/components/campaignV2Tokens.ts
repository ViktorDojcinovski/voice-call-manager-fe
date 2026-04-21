/** Campaign v2 UI tokens (orange accent aligned with app theme primary). */

const accentRgb = "243, 165, 33";

export const campaignV2 = {
  accent: "#f3a521",
  accentDark: "#c58a1a",
  accentLight: "#fcd34d",
  gradient: "linear-gradient(90deg,#d97706 0%,#f3a521 45%,#fbbf24 100%)",
  pageBg: "#F4F5F8",
  cardBg: "#FFFFFF",
  cardBorder: `1px solid rgba(${accentRgb}, 0.12)`,
  cardRadius: 12,
  timelineBadgeBg: "#0D9488",
  timelineBadgeColor: "#fff",
  tabIndicator: "#f3a521",
  link: "#c58a1a",
  /** MUI outlined controls (Select, TextField) */
  outlineBorder: `rgba(${accentRgb}, 0.35)`,
  /** Hover / subtle fills (buttons, rows) */
  subtleFill: `rgba(${accentRgb}, 0.06)`,
  rowSelectedFill: `rgba(${accentRgb}, 0.08)`,
  /** Contained CTA shadow on light backgrounds */
  ctaShadow: `0 2px 8px rgba(${accentRgb}, 0.35)`,
  /** Table header background */
  tableHeaderFill: `rgba(${accentRgb}, 0.08)`,
  /** Table / section divider under accent header */
  tableDivider: `1px solid rgba(${accentRgb}, 0.12)`,
  /** Card or panel outline (softer than outlineBorder) */
  surfaceBorder: `1px solid rgba(${accentRgb}, 0.2)`,
  /** List row hover / selected band */
  rowHoverBand: `rgba(${accentRgb}, 0.12)`,
  /** `borderColor` for subtle outlines (matches card border tint) */
  mutedBorder: `rgba(${accentRgb}, 0.12)`,
} as const;

export const campaignV2CardSx = {
  borderRadius: `${campaignV2.cardRadius}px`,
  bgcolor: campaignV2.cardBg,
  border: campaignV2.cardBorder,
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
} as const;

export const campaignV2SectionTitleSx = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.06em",
  color: "text.secondary",
  textTransform: "uppercase" as const,
};
