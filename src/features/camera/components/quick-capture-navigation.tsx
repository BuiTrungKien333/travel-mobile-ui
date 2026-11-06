import { router } from "expo-router";
import { FloatingNavigation } from "@/components/common/floating-bottom-navigation";
import { AppIcon } from "@/components/ui/app-icon";
import { useHomeCopy } from "@/features/home/i18n/home-copy";

export function QuickCaptureNavigation({
  onHeightChange,
  animationEnabled,
}: {
  onHeightChange: (height: number) => void;
  animationEnabled: boolean;
}) {
  const { copy } = useHomeCopy();
  const items = [
    { key: "home", label: copy.home, icon: "home", path: "/tabs" },
    { key: "trips", label: copy.trips, icon: "compass", path: "/tabs/trips" },
    {
      key: "memories",
      label: copy.memories,
      icon: "memories",
      path: "/tabs/memories",
    },
    {
      key: "profile",
      label: copy.profile,
      icon: "person",
      path: "/tabs/profile",
    },
  ] as const;
  return (
    <FloatingNavigation
      items={items.map((item) => ({
        key: item.key,
        label: item.label,
        icon: (_focused, color, size) => (
          <AppIcon
            name={item.icon}
            variant="outline"
            color={color}
            size={size}
          />
        ),
        onPress: () => router.dismissTo(item.path),
      }))}
      onCapture={() => router.navigate("/memories/quick-capture")}
      captureLabel={copy.capture}
      animationEnabled={animationEnabled}
      onHeightChange={onHeightChange}
    />
  );
}
