import { Platform, StyleSheet, type TextStyle } from "react-native";
import { spacing, typography, layout } from "@/theme/tokens";

export const webInputReset: TextStyle = Platform.select({
  web: { outlineWidth: 0 },
  default: {},
});

export const createTripStyles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },

  backButton: {
    width: layout.compactTouchTarget,
    height: layout.compactTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTextCol: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  card: {
    borderWidth: 1,
    padding: spacing.md,
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md + spacing.xxs,
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  cardInfoCol: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },

  destinationTitle: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },

  dateHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  dateHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 1,
  },

  iconCircleSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  dateCardTitle: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.md,
  },

  dateColumnsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md + spacing.xxs,
  },

  dateColumnBlock: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },

  dateVerticalDivider: {
    width: 1,
    height: 32,
    marginHorizontal: spacing.sm + spacing.xxs,
  },

  dateValueText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },

  durationBadge: {
    paddingHorizontal: spacing.sm + spacing.xxs,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },

  durationText: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
  },

  titleInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: layout.touchTarget,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },

  titleInput: {
    flex: 1,
    minWidth: 0,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    minHeight: layout.touchTarget,
    paddingVertical: spacing.sm,
  },

  clearTitleButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  sectionHeading: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.md,
  },

  addPlaceDashedCard: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md + spacing.xxs,
    gap: spacing.md,
  },

  addPlaceIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  addPlaceTextCol: {
    flex: 1,
    gap: spacing.xxs,
  },

  addPlaceTitle: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },

  stopsList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },

  stopItemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm + spacing.xxs,
    gap: spacing.sm + spacing.xxs,
  },

  stopIndexBadge: {
    minWidth: spacing.xl,
    minHeight: spacing.xl,
    padding: spacing.xxs,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  stopIndexText: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
  },

  stopInfoCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  stopNameText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },

  removeStopBtn: {
    width: layout.compactTouchTarget,
    height: layout.compactTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },

  addMoreStopsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    minHeight: layout.compactTouchTarget,
    gap: spacing.xs + spacing.xxs,
    marginTop: spacing.xs,
  },

  addMoreStopsText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },

  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md + spacing.xxs,
  },

  accordionTitle: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },

  accordionBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.md + spacing.xxs,
  },

  budgetInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    minHeight: layout.touchTarget,
    paddingHorizontal: spacing.md,
  },

  budgetInput: {
    flex: 1,
    minWidth: 0,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    minHeight: layout.touchTarget,
    paddingVertical: spacing.sm,
  },

  budgetSuffix: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
  },

  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },

  chip: {
    minHeight: layout.compactTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 1,
    borderWidth: 1,
  },

  chipCheck: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: "bold",
  },

  chipText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },

  errorBanner: {
    borderWidth: 1,
    padding: spacing.md,
  },

  errorText: {
    textAlign: "center",
  },

  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },

  createButton: {
    width: "100%",
    minHeight: layout.buttonHeight,
  },

  bottomHintText: {
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
