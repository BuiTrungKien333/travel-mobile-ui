import { ProfileScreen } from "@/features/auth/screens/profile-screen";
import { UI_PREVIEW_ENABLED } from "@/constants/development";
import { PreviewProfileScreen } from "@/features/home/screens/preview-profile-screen";
export default function ProfileRoute() {
  return UI_PREVIEW_ENABLED ? <PreviewProfileScreen /> : <ProfileScreen />;
}
