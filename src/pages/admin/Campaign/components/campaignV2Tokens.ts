/** Campaign v2 UI tokens (purple accent, surfaces). */

export const campaignV2 = {
  accent: "#6B46C1",
  accentDark: "#553C9A",
  accentLight: "#9F7AEA",
  gradient: "linear-gradient(90deg,#5B21B6 0%,#6B46C1 45%,#7C3AED 100%)",
  pageBg: "#F4F5F8",
  cardBg: "#FFFFFF",
  cardBorder: "1px solid rgba(107, 70, 193, 0.12)",
  cardRadius: 12,
  timelineBadgeBg: "#0D9488",
  timelineBadgeColor: "#fff",
  tabIndicator: "#6B46C1",
  link: "#6B46C1",
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
