import { neutral, threedScene } from "@/core/theme/tokens";
import { Stack } from "expo-router";

export default function SequenceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: neutral.page },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="viewer" options={{ contentStyle: { backgroundColor: threedScene.background } }} />
      <Stack.Screen
        name="edit"
        options={{
          contentStyle: { backgroundColor: threedScene.background },
          orientation: "default",
        }}
      />
    </Stack>
  );
}
