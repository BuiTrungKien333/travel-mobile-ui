import { useState } from "react";
import { Pressable, Switch } from "react-native";
import { AppBottomSheet } from "@/components/common/app-bottom-sheet";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useProfileCopy } from "../i18n/profile-copy";
import { ProfileMenuRow, ProfileSection } from "./profile-section";

const interestIds = [
  "photography",
  "cafe",
  "nature",
  "food",
  "culture",
  "beach",
  "adventure",
  "shopping",
] as const;
type Interest = (typeof interestIds)[number];
const vehicles = ["motorcycle", "car", "walk"] as const;
type Vehicle = (typeof vehicles)[number];
type PreferencePanel = "address" | "interests" | "vehicle";
const addressPresets = [
  "Gò Vấp, TP. Hồ Chí Minh",
  "Quận 1, TP. Hồ Chí Minh",
  "Bình Thạnh, TP. Hồ Chí Minh",
  "Thủ Đức, TP. Hồ Chí Minh",
  "Cầu Giấy, Hà Nội",
  "Hải Châu, Đà Nẵng",
];

/** Local UI preferences only; no API or persisted account settings are implied. */
export function ProfilePreferences() {
  const theme = useAppTheme();
  const { copy } = useProfileCopy();
  const [address, setAddress] = useState(addressPresets[0]);
  const [draftAddress, setDraftAddress] = useState(address);
  const [interests, setInterests] = useState<Interest[]>([
    "photography",
    "cafe",
    "nature",
  ]);
  const [vehicle, setVehicle] = useState<Vehicle>("motorcycle");
  const [reminder, setReminder] = useState(true);
  const [panel, setPanel] = useState<PreferencePanel | null>(null);
  const close = () => setPanel(null);
  function toggleInterest(id: Interest) {
    setInterests((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }
  const optionStyle = (selected: boolean, pressed: boolean) => ({
    minHeight: theme.layout.touchTarget,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: selected ? theme.colors.primary : theme.colors.border,
    backgroundColor: selected ? theme.colors.surfaceTint : theme.colors.surface,
    opacity: pressed ? theme.motion.pressOpacity : 1,
  });
  return (
    <>
      <ProfileSection title={copy.travel}>
        <ProfileMenuRow
          icon="home"
          title={copy.address}
          subtitle={address}
          onPress={() => {
            setDraftAddress(address);
            setPanel("address");
          }}
        />
        <ProfileMenuRow
          icon="sparkles"
          title={copy.interests}
          subtitle={
            interests.map((id) => copy.interestLabels[id]).join(" · ") ||
            copy.add
          }
          onPress={() => setPanel("interests")}
        />
        <ProfileMenuRow
          icon={vehicle}
          title={copy.vehicle}
          subtitle={copy.vehicleLabels[vehicle]}
          onPress={() => setPanel("vehicle")}
          divider={false}
        />
      </ProfileSection>
      <AppText variant="caption" tone="muted">
        {copy.localHint}
      </AppText>
      <ProfileSection title={copy.options}>
        <ProfileMenuRow
          icon="tune"
          title={copy.language}
          trailing={<LanguageSwitcher />}
        />
        <ProfileMenuRow
          icon="bell"
          title={copy.reminder}
          subtitle={copy.reminderHint}
          divider={false}
          trailing={
            <Switch
              accessibilityLabel={copy.reminder}
              value={reminder}
              onValueChange={setReminder}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor={theme.colors.surface}
            />
          }
        />
      </ProfileSection>
      {panel ? (
        <AppBottomSheet
          title={copy[panel]}
          closeLabel={copy.close}
          onClose={close}
          contentGap={theme.spacing.md}
          heightRatio={0.75}
          footer={
            panel === "address" ? (
              <AppButton
                disabled={!draftAddress.trim()}
                onPress={() => {
                  setAddress(draftAddress.trim());
                  close();
                }}
              >
                {copy.saveAddress}
              </AppButton>
            ) : panel === "interests" ? (
              <AppButton onPress={close}>{copy.close}</AppButton>
            ) : undefined
          }
        >
          {panel === "address" ? (
            <>
              <AppInput
                label={copy.address}
                placeholder={copy.addressPlaceholder}
                value={draftAddress}
                onChangeText={setDraftAddress}
                maxLength={500}
                returnKeyType="done"
              />
              {addressPresets.map((value) => (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: draftAddress === value }}
                  onPress={() => setDraftAddress(value)}
                  style={({ pressed }) =>
                    optionStyle(draftAddress === value, pressed)
                  }
                >
                  <AppText variant="body" style={{ flex: 1 }}>
                    {value}
                  </AppText>
                  {draftAddress === value ? (
                    <AppIcon
                      name="tick"
                      size={theme.layout.iconSmall}
                      color={theme.colors.primaryText}
                    />
                  ) : null}
                </Pressable>
              ))}
            </>
          ) : panel === "interests" ? (
            interestIds.map((id) => (
              <Pressable
                key={id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: interests.includes(id) }}
                onPress={() => toggleInterest(id)}
                style={({ pressed }) =>
                  optionStyle(interests.includes(id), pressed)
                }
              >
                <AppText variant="body">{copy.interestLabels[id]}</AppText>
                {interests.includes(id) ? (
                  <AppIcon
                    name="tick"
                    size={theme.layout.iconSmall}
                    color={theme.colors.primaryText}
                  />
                ) : null}
              </Pressable>
            ))
          ) : (
            vehicles.map((id) => (
              <Pressable
                key={id}
                accessibilityRole="radio"
                accessibilityState={{ checked: id === vehicle }}
                onPress={() => {
                  setVehicle(id);
                  close();
                }}
                style={({ pressed }) => optionStyle(id === vehicle, pressed)}
              >
                <AppText variant="body">{copy.vehicleLabels[id]}</AppText>
                <AppIcon
                  name={id === vehicle ? "tick" : id}
                  size={theme.layout.iconSmall}
                  color={theme.colors.primaryText}
                />
              </Pressable>
            ))
          )}
        </AppBottomSheet>
      ) : null}
    </>
  );
}
