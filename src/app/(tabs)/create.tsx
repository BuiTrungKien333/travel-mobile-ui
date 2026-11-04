import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppText } from "@/components/ui/app-text";
import { spacing } from "@/theme/tokens";

export default function CreateRoute() {
  return (
    <ScreenSafeArea style={{ flex: 1 }}>
      <AppText variant="heading" style={{ padding: spacing.lg }}>
        Tạo chuyến đi
      </AppText>
    </ScreenSafeArea>
  );
}
