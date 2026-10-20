import { EmptyState } from "@/core/components";
import { router, Stack } from "expo-router";
import { House, SearchX } from "lucide-react-native";
import { YStack } from "tamagui";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: t("errorNotFound") }} />
      <YStack flex={1} backgroundColor="$neutralPage">
        <EmptyState
          icon={SearchX}
          title={t("errorNotFound")}
          action={{ label: t("navHome"), icon: House, onPress: () => router.replace("/") }}
        />
      </YStack>
    </>
  );
}
