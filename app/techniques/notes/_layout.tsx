import { Stack } from "expo-router";
import { useTheme } from "tamagui";

export default function NotesLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background.val },
      }}
    />
  );
}
