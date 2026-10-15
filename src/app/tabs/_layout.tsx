import { Tabs } from "expo-router/js-tabs";
import { View } from "react-native";

import { FloatingBottomNavigation } from "@/components/common/floating-bottom-navigation";
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { PreviewPanels } from "@/features/home/components/preview-panels";
import { useHomeCopy } from "@/features/home/i18n/home-copy";
import {
  TripPreviewProvider,
  useTripPreview,
} from "@/features/home/providers/trip-preview-provider";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function AuthenticatedLayout() {
  return (
    <TripPreviewProvider>
      <WorkspaceTabs />
      <PreviewPanels />
    </TripPreviewProvider>
  );
}

function WorkspaceTabs() {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  const panelOpen = useTripPreview((state) => state.panel !== null);
  const tabs: { name: string; title: string; icon: AppIconName }[] = [
    { name: "index", title: copy.home, icon: "home" },
    { name: "trips", title: copy.trips, icon: "map" },
    { name: "memories", title: copy.memories, icon: "memories" },
    { name: "profile", title: copy.profile, icon: "person" },
  ];
  return (
    <View
      style={{ flex: 1 }}
      aria-hidden={panelOpen}
      accessibilityElementsHidden={panelOpen}
      importantForAccessibility={panelOpen ? "no-hide-descendants" : "auto"}
    >
      <Tabs
        initialRouteName="index"
        tabBar={(props) => <FloatingBottomNavigation {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: { position: "absolute" },
          sceneStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {tabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarAccessibilityLabel: tab.title,
              tabBarIcon: ({ focused, color, size }) => (
                <AppIcon
                  name={tab.icon}
                  color={color}
                  size={size}
                  variant={focused ? "solid" : "outline"}
                />
              ),
            }}
          />
        ))}
      </Tabs>
    </View>
  );
}
