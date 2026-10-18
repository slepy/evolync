import { threedScene } from "@/core/theme/tokens";
import { Stack } from "expo-router";
import { useTheme } from "tamagui";

export default function SequenceLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background.val },
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
