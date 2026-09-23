import { Stack } from "expo-router";

export default function ThreeDLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F8FAFC" },
      }}
    />
  );
}
