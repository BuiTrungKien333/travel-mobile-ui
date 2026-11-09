import { Pressable, TextInput, View } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";

import { tripFormLimits } from "../constants/trip-form";
import { useTripCopy } from "../i18n/trip-copy";
import { useState, type RefObject } from "react";
import type { ControllerRenderProps, FieldErrors } from "react-hook-form";
import type { CreateTripInput } from "../schemas/create-trip-schema";
import { createTripStyles as styles, webInputReset } from "./create-trip-styles";

type Props = { tripTitle: string; titleEdited: RefObject<boolean>; titleField: ControllerRenderProps<CreateTripInput, "title">; errors: FieldErrors<CreateTripInput>; };

export function CreateTripNameCard({ tripTitle, titleEdited, titleField, errors }: Props) {
  const [isTitleFocused, setIsTitleFocused] = useState(false);
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
          gap: theme.spacing.xs,
        },
      ]}
    >
      <AppText
        variant="label"
        style={{
          fontFamily: theme.typography.fontFamily.medium,
          color: theme.colors.text,
        }}
      >
        {copy.tripTitle}
      </AppText>
      <View
        style={[
          styles.titleInputWrapper,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isTitleFocused
              ? theme.colors.focus
              : theme.colors.borderStrong,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <TextInput
          allowFontScaling
          value={tripTitle}
          onChangeText={(text) => {
            titleEdited.current = true;
            titleField.onChange(text);
          }}
          ref={titleField.ref}
          accessibilityLabel={copy.tripTitle}
          maxLength={tripFormLimits.title}
          onFocus={() => setIsTitleFocused(true)}
          onBlur={() => {
            setIsTitleFocused(false);
            titleField.onBlur();
          }}
          placeholder={copy.titlePlaceholder}
          placeholderTextColor={theme.colors.textSecondary}
          cursorColor={theme.colors.primaryText}
          selectionColor={theme.colors.surfaceTint}
          underlineColorAndroid="transparent"
          style={[
            styles.titleInput,
            {
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily.regular,
            },
            webInputReset,
          ]}
        />
        {tripTitle.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.clearTitle}
            onPress={() => {
              titleEdited.current = true;
              titleField.onChange("");
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.clearTitleButton,
              { opacity: pressed ? theme.motion.pressOpacity : 1 },
            ]}
          >
            <AppIcon
              name="close"
              size={16}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      <AppText
        variant={errors.title ? "body" : "caption"}
        tone={errors.title ? "error" : "muted"}
        accessibilityRole={errors.title ? "alert" : undefined}
        accessibilityLiveRegion={errors.title ? "polite" : "none"}
      >
        {errors.title?.message || copy.titleHint}
      </AppText>
    </View>
  );
}
