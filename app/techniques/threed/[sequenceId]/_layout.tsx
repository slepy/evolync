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
      <Stack.Screen name="viewer" />
      <Stack.Screen
        name="edit"
        options={{
          contentStyle: { backgroundColor: "#000" },
          orientation: "default",
        }}
      />
    </Stack>
  );
}
