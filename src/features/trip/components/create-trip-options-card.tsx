import { Pressable, TextInput, View } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";

import { tripPreferenceIds } from "../constants/trip-form";
import { useTripCopy } from "../i18n/trip-copy";
import { useState, type Dispatch, type SetStateAction } from "react";
import type { ControllerRenderProps, FieldErrors } from "react-hook-form";
import type { CreateTripInput } from "../schemas/create-trip-schema";
import type { TripPreference } from "@/features/home/types/home-types";
import { createTripStyles as styles, webInputReset } from "./create-trip-styles";

type Props = { isAccordionOpen: boolean; setIsAccordionOpen: Dispatch<SetStateAction<boolean>>; budget: string; handleBudgetChange: (text: string) => void; budgetField: ControllerRenderProps<CreateTripInput, "budget">; errors: FieldErrors<CreateTripInput>; selectedTags: TripPreference[]; toggleTag: (tag: TripPreference) => void; };

export function CreateTripOptionsCard({ isAccordionOpen, setIsAccordionOpen, budget, handleBudgetChange, budgetField, errors, selectedTags, toggleTag }: Props) {
  const [isBudgetFocused, setIsBudgetFocused] = useState(false);
  const theme = useAppTheme();
  const { copy } = useTripCopy();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${copy.moreOptions}: ${copy.moreOptionsHint}`}
        accessibilityState={{ expanded: isAccordionOpen }}
        onPress={() => setIsAccordionOpen((prev) => !prev)}
        style={({ pressed }) => [
          styles.accordionHeader,
          { opacity: pressed ? theme.motion.pressOpacity : 1 },
        ]}
      >
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: theme.colors.surfaceTint },
          ]}
        >
          <AppIcon
            name="tune"
            size={18}
            color={theme.colors.primaryText}
          />
        </View>

        <View style={styles.cardInfoCol}>
          <AppText
            style={[
              styles.accordionTitle,
              {
                fontFamily: theme.typography.fontFamily.medium,
                color: theme.colors.text,
              },
            ]}
          >
            {copy.moreOptions}
          </AppText>
          <AppText variant="caption" tone="muted">
            {copy.moreOptionsHint}
          </AppText>
        </View>

        <View
          style={{
            transform: [{ rotate: isAccordionOpen ? "-90deg" : "90deg" }],
          }}
        >
          <AppIcon
            name="chevron"
            size={18}
            color={theme.colors.textSecondary}
          />
        </View>
      </Pressable>

      {/* Expanded Content (State 04) */}
      {isAccordionOpen ? (
        <View
          style={[
            styles.accordionBody,
            {
              borderTopColor: theme.colors.border,
              paddingTop: theme.spacing.md,
              gap: theme.spacing.md,
            },
          ]}
        >
          {/* Ngân sách */}
          <View style={{ gap: theme.spacing.xs }}>
            <AppText
              variant="label"
              style={{
                fontFamily: theme.typography.fontFamily.medium,
                color: theme.colors.text,
              }}
            >
              {copy.budget}
            </AppText>
            <View
              style={[
                styles.budgetInputWrapper,
                {
                  borderColor: isBudgetFocused
                    ? theme.colors.focus
                    : theme.colors.borderStrong,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <TextInput
                allowFontScaling
                value={budget}
                onChangeText={handleBudgetChange}
                ref={budgetField.ref}
                accessibilityLabel={copy.budget}
                maxLength={20}
                onFocus={() => setIsBudgetFocused(true)}
                onBlur={() => {
                  setIsBudgetFocused(false);
                  budgetField.onBlur();
                }}
                keyboardType="numeric"
                placeholder={copy.budgetPlaceholder}
                placeholderTextColor={theme.colors.textSecondary}
                cursorColor={theme.colors.primaryText}
                selectionColor={theme.colors.surfaceTint}
                underlineColorAndroid="transparent"
                style={[
                  styles.budgetInput,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily.regular,
                  },
                  webInputReset,
                ]}
              />
              <AppText
                style={[
                  styles.budgetSuffix,
                  {
                    color: theme.colors.primaryText,
                    fontFamily: theme.typography.fontFamily.medium,
                  },
                ]}
              >
                VND
              </AppText>
            </View>
            <AppText
              variant={errors.budget ? "body" : "caption"}
              tone={errors.budget ? "error" : "muted"}
              accessibilityRole={errors.budget ? "alert" : undefined}
              accessibilityLiveRegion={errors.budget ? "polite" : "none"}
            >
              {errors.budget?.message || copy.budgetHint}
            </AppText>
          </View>

          {/* Sở thích trải nghiệm */}
          <View style={{ gap: theme.spacing.xs }}>
            <AppText
              variant="label"
              style={{
                fontFamily: theme.typography.fontFamily.medium,
                color: theme.colors.text,
              }}
            >
              {copy.preferencesTitle}
            </AppText>
            <AppText variant="caption" tone="muted">
              {copy.preferencesHint}
            </AppText>

            <View style={styles.chipsContainer}>
              {tripPreferenceIds.map((chip) => {
                const isSelected = selectedTags.includes(chip);
                return (
                  <Pressable
                    key={copy.preferences[chip]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => toggleTag(chip)}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.surfaceTint
                          : theme.colors.surface,
                        borderColor: isSelected
                          ? theme.colors.primaryText
                          : theme.colors.border,
                        borderRadius: theme.radius.full,
                        opacity: pressed ? theme.motion.pressOpacity : 1,
                      },
                    ]}
                  >
                    {isSelected ? (
                      <AppText
                        style={[
                          styles.chipCheck,
                          { color: theme.colors.primaryText },
                        ]}
                      >
                        ✓{" "}
                      </AppText>
                    ) : null}
                    <AppText
                      style={[
                        styles.chipText,
                        {
                          color: isSelected
                            ? theme.colors.primaryText
                            : theme.colors.textSecondary,
                          fontFamily: isSelected
                            ? theme.typography.fontFamily.medium
                            : theme.typography.fontFamily.regular,
                        },
                      ]}
                    >
                      {copy.preferences[chip]}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
