import { Stack } from "expo-router";

export default function SequenceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F8FAFC" },
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
