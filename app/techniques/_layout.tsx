import { neutral } from "@/core/theme/tokens";
import { Stack } from "expo-router";

export default function TechniquesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: neutral.page },
      }}
    />
  );
}
