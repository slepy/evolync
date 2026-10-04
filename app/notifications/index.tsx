import { MainNav } from "@/core/components";
import { NotificationsScreen } from "@/modules/notifications";
import { View } from "react-native";

export default function NotificationsRoute() {
  return (
    <View style={{ flex: 1 }}>
      <NotificationsScreen />
      <MainNav />
    </View>
  );
}
