import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { darkTheme, lightTheme, type AppTheme } from "@/theme";

type ThemeMode = "light" | "dark";

export default function ThemeShowcaseScreen() {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(
    systemColorScheme === "dark" ? "dark" : "light",
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [destination, setDestination] = useState("Đà Nẵng");
  const [isInputFocused, setIsInputFocused] = useState(false);

  const theme = mode === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const palette = getPalette(mode, theme);
  const statuses = getStatuses(theme);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={theme.dark ? "light" : "dark"} />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>T</Text>
            </View>

            <View style={styles.brandContent}>
              <Text style={styles.eyebrow}>TRIPZY DESIGN SYSTEM</Text>
              <Text style={styles.heroTitle}>Khám phá giao diện</Text>
              <Text style={styles.heroSubtitle}>
                Lập kế hoạch – Trải nghiệm – Lưu giữ
              </Text>
            </View>
          </View>

          <View style={styles.themeSelector}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: mode === "light" }}
              onPress={() => setMode("light")}
              style={[
                styles.themeOption,
                mode === "light" && styles.themeOptionActive,
              ]}
            >
              <Text
                style={[
                  styles.themeOptionText,
                  mode === "light" && styles.themeOptionTextActive,
                ]}
              >
                ☀ Sáng
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: mode === "dark" }}
              onPress={() => setMode("dark")}
              style={[
                styles.themeOption,
                mode === "dark" && styles.themeOptionActive,
              ]}
            >
              <Text
                style={[
                  styles.themeOptionText,
                  mode === "dark" && styles.themeOptionTextActive,
                ]}
              >
                ◐ Tối
              </Text>
            </Pressable>
          </View>
        </View>

        <SectionHeader
          title="Bảng màu"
          description="Các màu theo vai trò, không dùng mã màu trực tiếp trong component."
          theme={theme}
        />

        <View style={styles.paletteGrid}>
          {palette.map((item) => (
            <View key={item.name} style={styles.swatchCard}>
              <View
                style={[
                  styles.swatch,
                  {
                    backgroundColor: item.color,
                    borderColor: item.borderColor ?? item.color,
                  },
                ]}
              >
                <Text style={[styles.swatchSymbol, { color: item.onColor }]}>
                  Aa
                </Text>
              </View>
              <Text style={styles.swatchName}>{item.name}</Text>
              <Text style={styles.swatchHex}>{item.hex}</Text>
            </View>
          ))}
        </View>

        <SectionHeader
          title="Typography"
          description="Phân cấp tiêu đề, nội dung và chú thích."
          theme={theme}
        />

        <View style={styles.sectionCard}>
          <Text style={styles.displayText}>Hành trình mới</Text>
          <Text style={styles.headingText}>Khám phá Đà Nẵng</Text>
          <Text style={styles.titleText}>Lịch trình hôm nay</Text>
          <Text style={styles.bodyText}>
            Bắt đầu từ Cầu Rồng, ghé Ngũ Hành Sơn và kết thúc ngày tại biển Mỹ
            Khê.
          </Text>
          <Text style={styles.captionText}>
            Cập nhật lần cuối lúc 20:30 · 12/09/2026
          </Text>
          <Text style={styles.linkText}>Xem chi tiết hành trình →</Text>
        </View>

        <SectionHeader
          title="Buttons"
          description="Các mức nhấn mạnh dành cho hành động chính và phụ."
          theme={theme}
        />

        <View style={styles.sectionCard}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.button,
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Tạo chuyến đi mới</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.button,
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Xem gợi ý nổi bật</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.button,
              styles.outlineButton,
              pressed && styles.outlineButtonPressed,
            ]}
          >
            <Text style={styles.outlineButtonText}>Chỉnh sửa lịch trình</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.button,
              styles.ghostButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.ghostButtonText}>Bỏ qua đề xuất</Text>
          </Pressable>

          <View style={[styles.button, styles.disabledButton]}>
            <Text style={styles.disabledButtonText}>Chưa đủ thông tin</Text>
          </View>
        </View>

        <SectionHeader
          title="Inputs"
          description="Trạng thái mặc định, focus và lỗi xác thực."
          theme={theme}
        />

        <View style={styles.sectionCard}>
          <Text style={styles.inputLabel}>Điểm đến</Text>
          <TextInput
            value={destination}
            onChangeText={setDestination}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder="Bạn muốn đi đâu?"
            placeholderTextColor={theme.colors.textDisabled}
            selectionColor={theme.colors.primaryText}
            style={[styles.input, isInputFocused && styles.inputFocused]}
          />
          <Text style={styles.helperText}>
            Nhập tỉnh, thành phố hoặc địa điểm bạn muốn khám phá.
          </Text>

          <Text style={[styles.inputLabel, styles.inputLabelSpacing]}>
            Ngày kết thúc
          </Text>
          <View style={[styles.input, styles.inputError]}>
            <Text style={styles.inputValue}>10/09/2026</Text>
          </View>
          <Text style={styles.errorText}>
            Ngày kết thúc phải sau ngày bắt đầu.
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Nhắc lịch trình</Text>
              <Text style={styles.settingDescription}>
                Nhận thông báo trước mỗi hoạt động.
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{
                false: theme.colors.borderStrong,
                true: theme.colors.primary,
              }}
              thumbColor={
                notificationsEnabled
                  ? theme.colors.onPrimary
                  : theme.colors.surface
              }
              ios_backgroundColor={theme.colors.borderStrong}
            />
          </View>
        </View>

        <SectionHeader
          title="Status & feedback"
          description="Luôn kết hợp màu với icon hoặc nội dung chữ."
          theme={theme}
        />

        <View style={styles.chipContainer}>
          {statuses.map((status) => (
            <View
              key={status.label}
              style={[
                styles.statusChip,
                { backgroundColor: status.background },
              ]}
            >
              <Text style={[styles.statusChipText, { color: status.color }]}>
                {status.symbol} {status.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerIcon}>i</Text>
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerTitle}>
              Thời tiết có thể thay đổi
            </Text>
            <Text style={styles.infoBannerText}>
              Khả năng mưa 65% vào buổi chiều. Hãy chuẩn bị áo mưa nhẹ.
            </Text>
          </View>
        </View>

        <SectionHeader
          title="Trip card"
          description="Ví dụ card chuyến đi sử dụng đầy đủ màu và phân cấp chữ."
          theme={theme}
        />

        <View style={styles.tripCard}>
          <View style={styles.tripCover}>
            <View style={styles.tripCoverBadge}>
              <Text style={styles.tripCoverBadgeText}>Sắp diễn ra</Text>
            </View>
            <Text style={styles.tripCoverIcon}>✈</Text>
            <Text style={styles.tripCoverText}>ĐÀ NẴNG</Text>
          </View>

          <View style={styles.tripContent}>
            <View style={styles.tripHeaderRow}>
              <View style={styles.tripTitleContent}>
                <Text style={styles.tripTitle}>Đà Nẵng – Hội An</Text>
                <Text style={styles.tripDate}>16–20 tháng 9 · 5 ngày</Text>
              </View>
              <View style={styles.daysBadge}>
                <Text style={styles.daysBadgeText}>5N</Text>
              </View>
            </View>

            <View style={styles.tripStats}>
              <StatItem value="12" label="Địa điểm" styles={styles} />
              <View style={styles.statDivider} />
              <StatItem value="4/5" label="Ngày đã lên lịch" styles={styles} />
              <View style={styles.statDivider} />
              <StatItem value="68%" label="Hoàn thành" styles={styles} />
            </View>

            <View style={styles.progressTrack}>
              <View style={styles.progressValue} />
            </View>

            <View style={styles.tripFooter}>
              <Text style={styles.tripHint}>
                Lịch trình còn 1 ngày chưa hoàn tất
              </Text>
              <Text style={styles.tripAction}>Tiếp tục →</Text>
            </View>
          </View>
        </View>

        <SectionHeader
          title="Navigation preview"
          description="Tab đang chọn dùng primaryText để rõ trên nền surface."
          theme={theme}
        />

        <View style={styles.tabBarPreview}>
          <TabItem symbol="⌂" label="Trang chủ" active styles={styles} />
          <TabItem symbol="◇" label="Chuyến đi" styles={styles} />
          <TabItem symbol="▣" label="Kỷ niệm" styles={styles} />
          <TabItem symbol="○" label="Cá nhân" styles={styles} />
        </View>

        <Text style={styles.footerText}>
          Tripzy UI preview · {mode === "light" ? "Light theme" : "Dark theme"}
        </Text>

        <Text
          style={{
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: 16,
          }}
        >
          Inter Regular – Lập kế hoạch chuyến đi
        </Text>

        <Text
          style={{
            fontFamily: theme.typography.fontFamily.semibold,
            fontSize: 20,
          }}
        >
          Inter SemiBold – Khám phá Đà Nẵng
        </Text>

        <Text
          style={{
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: 32,
          }}
        >
          Inter Bold – Tripzy
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

type SectionHeaderProps = {
  title: string;
  description: string;
  theme: AppTheme;
};

function SectionHeader({ title, description, theme }: SectionHeaderProps) {
  return (
    <View
      style={{ marginTop: theme.spacing.xxl, marginBottom: theme.spacing.md }}
    >
      <Text
        style={{
          color: theme.colors.text,
          fontSize: theme.typography.fontSize.xl,
          lineHeight: theme.typography.lineHeight.xl,
          fontWeight: theme.typography.fontWeight.bold,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          marginTop: theme.spacing.xs,
          color: theme.colors.textSecondary,
          fontSize: theme.typography.fontSize.sm,
          lineHeight: theme.typography.lineHeight.sm,
        }}
      >
        {description}
      </Text>
    </View>
  );
}

type ShowcaseStyles = ReturnType<typeof createStyles>;

function StatItem({
  value,
  label,
  styles,
}: {
  value: string;
  label: string;
  styles: ShowcaseStyles;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TabItem({
  symbol,
  label,
  active = false,
  styles,
}: {
  symbol: string;
  label: string;
  active?: boolean;
  styles: ShowcaseStyles;
}) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.tabIconBox, active && styles.tabIconBoxActive]}>
        <Text style={[styles.tabIcon, active && styles.tabIconActive]}>
          {symbol}
        </Text>
      </View>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

function getPalette(mode: ThemeMode, theme: AppTheme) {
  const isDark = mode === "dark";

  return [
    {
      name: "Primary",
      hex: isDark ? "#4ECFD9" : "#21B5C3",
      color: theme.colors.primary,
      onColor: theme.colors.onPrimary,
    },
    {
      name: "Primary text",
      hex: isDark ? "#7ADBE3" : "#146D75",
      color: theme.colors.primaryText,
      onColor: isDark ? "#052F33" : "#FFFFFF",
    },
    {
      name: "Secondary",
      hex: isDark ? "#FFAB91" : "#FF8A65",
      color: theme.colors.secondary,
      onColor: theme.colors.onSecondary,
    },
    {
      name: "Background",
      hex: isDark ? "#081315" : "#F8FAFC",
      color: theme.colors.background,
      onColor: theme.colors.text,
      borderColor: theme.colors.borderStrong,
    },
    {
      name: "Surface",
      hex: isDark ? "#102024" : "#FFFFFF",
      color: theme.colors.surface,
      onColor: theme.colors.text,
      borderColor: theme.colors.borderStrong,
    },
    {
      name: "Success",
      hex: isDark ? "#4ADE80" : "#15803D",
      color: theme.colors.success,
      onColor: isDark ? "#052E16" : "#FFFFFF",
    },
    {
      name: "Warning",
      hex: isDark ? "#FBBF24" : "#A15C00",
      color: theme.colors.warning,
      onColor: isDark ? "#422006" : "#FFFFFF",
    },
    {
      name: "Error",
      hex: isDark ? "#F87171" : "#B91C1C",
      color: theme.colors.error,
      onColor: isDark ? "#450A0A" : "#FFFFFF",
    },
  ];
}

function getStatuses(theme: AppTheme) {
  return [
    {
      label: "Hoàn thành",
      symbol: "✓",
      background: theme.colors.successSurface,
      color: theme.colors.onSuccessSurface,
    },
    {
      label: "Đang chờ",
      symbol: "◷",
      background: theme.colors.warningSurface,
      color: theme.colors.onWarningSurface,
    },
    {
      label: "Có lỗi",
      symbol: "!",
      background: theme.colors.errorSurface,
      color: theme.colors.onErrorSurface,
    },
    {
      label: "Gợi ý AI",
      symbol: "✦",
      background: theme.colors.infoSurface,
      color: theme.colors.onInfoSurface,
    },
  ];
}

function createStyles(theme: AppTheme) {
  const activeColor = theme.colors.primaryText;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.section,
    },

    hero: {
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.surface,
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    logo: {
      width: 64,
      height: 64,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.primary,
    },
    logoText: {
      color: theme.colors.onPrimary,
      fontSize: theme.typography.fontSize.xxl,
      fontWeight: theme.typography.fontWeight.bold,
    },
    brandContent: {
      flex: 1,
    },
    eyebrow: {
      color: activeColor,
      fontSize: theme.typography.fontSize.xs,
      lineHeight: theme.typography.lineHeight.xs,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: 1,
    },
    heroTitle: {
      marginTop: theme.spacing.xs,
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.xxl,
      lineHeight: theme.typography.lineHeight.xxl,
      fontWeight: theme.typography.fontWeight.bold,
    },
    heroSubtitle: {
      marginTop: theme.spacing.xs,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSize.sm,
      lineHeight: theme.typography.lineHeight.sm,
    },
    themeSelector: {
      flexDirection: "row",
      marginTop: theme.spacing.xl,
      padding: theme.spacing.xs,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceVariant,
    },
    themeOption: {
      flex: 1,
      minHeight: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: theme.radius.sm,
    },
    themeOptionActive: {
      backgroundColor: theme.colors.primary,
    },
    themeOptionText: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    themeOptionTextActive: {
      color: theme.colors.onPrimary,
    },

    paletteGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.md,
    },
    swatchCard: {
      width: "47.5%",
      padding: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
    },
    swatch: {
      height: 74,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderRadius: theme.radius.sm,
    },
    swatchSymbol: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
    },
    swatchName: {
      marginTop: theme.spacing.sm,
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    swatchHex: {
      marginTop: theme.spacing.xxs,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSize.xs,
    },

    sectionCard: {
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface,
    },
    displayText: {
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.display,
      lineHeight: theme.typography.lineHeight.display,
      fontWeight: theme.typography.fontWeight.bold,
    },
    headingText: {
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.xxl,
      lineHeight: theme.typography.lineHeight.xxl,
      fontWeight: theme.typography.fontWeight.bold,
    },
    titleText: {
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.lg,
      lineHeight: theme.typography.lineHeight.lg,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    bodyText: {
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.md,
      lineHeight: theme.typography.lineHeight.md,
    },
    captionText: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSize.sm,
      lineHeight: theme.typography.lineHeight.sm,
    },
    linkText: {
      color: activeColor,
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
    },

    button: {
      minHeight: 52,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.radius.md,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
    },
    primaryButtonPressed: {
      backgroundColor: theme.colors.primaryPressed,
    },
    primaryButtonText: {
      color: theme.colors.onPrimary,
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    secondaryButton: {
      backgroundColor: theme.colors.secondary,
    },
    secondaryButtonText: {
      color: theme.colors.onSecondary,
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    outlineButton: {
      borderWidth: 1.5,
      borderColor: activeColor,
      backgroundColor: "transparent",
    },
    outlineButtonPressed: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    outlineButtonText: {
      color: activeColor,
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    ghostButton: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    ghostButtonText: {
      color: activeColor,
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    disabledButton: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    disabledButtonText: {
      color: theme.colors.textDisabled,
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.medium,
    },
    buttonPressed: {
      opacity: 0.82,
    },

    inputLabel: {
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    inputLabelSpacing: {
      marginTop: theme.spacing.sm,
    },
    input: {
      minHeight: 52,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.md,
    },
    inputFocused: {
      borderWidth: 2,
      borderColor: theme.colors.focus,
    },
    inputError: {
      borderWidth: 1.5,
      borderColor: theme.colors.error,
    },
    inputValue: {
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.md,
    },
    helperText: {
      marginTop: -theme.spacing.sm,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSize.xs,
      lineHeight: theme.typography.lineHeight.xs,
    },
    errorText: {
      marginTop: -theme.spacing.sm,
      color: theme.colors.error,
      fontSize: theme.typography.fontSize.xs,
      lineHeight: theme.typography.lineHeight.xs,
    },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    settingDescription: {
      marginTop: theme.spacing.xs,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSize.sm,
      lineHeight: theme.typography.lineHeight.sm,
    },

    chipContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
    },
    statusChip: {
      minHeight: 34,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.full,
    },
    statusChipText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    infoBanner: {
      flexDirection: "row",
      gap: theme.spacing.md,
      marginTop: theme.spacing.md,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.infoSurface,
    },
    infoBannerIcon: {
      width: 24,
      height: 24,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.info,
      color: theme.dark ? "#082F49" : "#FFFFFF",
      textAlign: "center",
      lineHeight: 24,
      fontWeight: theme.typography.fontWeight.bold,
    },
    infoBannerContent: {
      flex: 1,
    },
    infoBannerTitle: {
      color: theme.colors.onInfoSurface,
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    infoBannerText: {
      marginTop: theme.spacing.xs,
      color: theme.colors.onInfoSurface,
      fontSize: theme.typography.fontSize.sm,
      lineHeight: theme.typography.lineHeight.sm,
    },

    tripCard: {
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.surface,
    },
    tripCover: {
      height: 150,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
    },
    tripCoverBadge: {
      position: "absolute",
      top: theme.spacing.md,
      right: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.secondary,
    },
    tripCoverBadgeText: {
      color: theme.colors.onSecondary,
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.bold,
    },
    tripCoverIcon: {
      color: theme.colors.onPrimary,
      fontSize: 42,
    },
    tripCoverText: {
      marginTop: theme.spacing.sm,
      color: theme.colors.onPrimary,
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: 3,
    },
    tripContent: {
      padding: theme.spacing.lg,
    },
    tripHeaderRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.spacing.md,
    },
    tripTitleContent: {
      flex: 1,
    },
    tripTitle: {
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.xl,
      lineHeight: theme.typography.lineHeight.xl,
      fontWeight: theme.typography.fontWeight.bold,
    },
    tripDate: {
      marginTop: theme.spacing.xs,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSize.sm,
    },
    daysBadge: {
      minWidth: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceVariant,
    },
    daysBadgeText: {
      color: activeColor,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.bold,
    },
    tripStats: {
      flexDirection: "row",
      marginTop: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.divider,
    },
    statItem: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: theme.spacing.xs,
    },
    statValue: {
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.bold,
    },
    statLabel: {
      marginTop: theme.spacing.xs,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSize.xs,
      textAlign: "center",
    },
    statDivider: {
      width: 1,
      backgroundColor: theme.colors.divider,
    },
    progressTrack: {
      height: 8,
      marginTop: theme.spacing.lg,
      overflow: "hidden",
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surfaceVariant,
    },
    progressValue: {
      width: "68%",
      height: "100%",
      borderRadius: theme.radius.full,
      backgroundColor: activeColor,
    },
    tripFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      marginTop: theme.spacing.md,
    },
    tripHint: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSize.xs,
    },
    tripAction: {
      color: activeColor,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
    },

    tabBarPreview: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 76,
      paddingHorizontal: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.surface,
    },
    tabItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    tabIconBox: {
      minWidth: 42,
      height: 30,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: theme.radius.full,
    },
    tabIconBoxActive: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    tabIcon: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSize.xl,
    },
    tabIconActive: {
      color: activeColor,
    },
    tabLabel: {
      marginTop: theme.spacing.xs,
      color: theme.colors.textSecondary,
      fontSize: 11,
      fontWeight: theme.typography.fontWeight.medium,
    },
    tabLabelActive: {
      color: activeColor,
      fontWeight: theme.typography.fontWeight.bold,
    },
    footerText: {
      marginTop: theme.spacing.xxl,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSize.xs,
      textAlign: "center",
    },
  });
}
