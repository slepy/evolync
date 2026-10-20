import { neutral } from "@/core/theme/tokens";
import { Stack } from "expo-router";

export default function NotesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: neutral.page },
      }}
    />
  );
}
