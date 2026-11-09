import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import type { AppLocale } from "@/i18n/translations";

const languageOptions: readonly { label: string; value: AppLocale }[] = [
  { label: "VI", value: "vi" },
  { label: "EN", value: "en" },
];

export function LanguageSwitcher() {
  const theme = useAppTheme();
  const { locale, setLocale, t } = useI18n();

  return (
    <View
      accessibilityLabel={t("language.selectorLabel")}
      accessibilityRole="radiogroup"
      style={styles.touchArea}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.full,
            padding: theme.spacing.xxs,
          },
        ]}
      >
        {languageOptions.map((option) => {
          const selected = locale === option.value;

          return (
            <Pressable
              accessibilityLabel={t(`language.${option.value}`)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              hitSlop={{ top: 6, right: 4, bottom: 6, left: 4 }}
              key={option.value}
              onPress={() => setLocale(option.value)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: selected
                    ? theme.colors.primary
                    : theme.colors.surfaceVariant,
                  borderRadius: theme.radius.full,
                  opacity: pressed ? 0.76 : 1,
                  paddingHorizontal: theme.spacing.sm,
                },
              ]}
            >
              <AppText
                style={{
                  color: selected
                    ? theme.colors.onPrimary
                    : theme.colors.textSecondary,
                  fontFamily: theme.typography.fontFamily.medium,
                }}
                variant="caption"
              >
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  touchArea: {
    padding: 6,
  },
  option: {
    minWidth: 36,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
