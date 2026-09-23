import { Header, HeaderTitle } from "@/modules/core/components";
import { NotesModeCard } from "@/modules/techniques/components";
import { useRouter } from "expo-router";
import { BookOpen, Box, Video } from "lucide-react-native";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";

export default function TechniquesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("techniquesNotebook")} />}
      />

      <YStack flex={1} padding="$4" gap="$3">
        <NotesModeCard
          title={t("techniquesModeThreeD")}
          description={t("techniquesModeThreeDDesc")}
          icon={<Box size={25} />}
          borderColor="$chineseCyan"
          iconBackground="$chineseCyanLighter"
          onPress={() => router.push("/techniques/threed" as any)}
          disabled
        />
        <NotesModeCard
          title={t("techniquesModeVideo")}
          description={t("techniquesModeVideoDesc")}
          icon={<Video size={25} />}
          borderColor="$chineseCyan"
          iconBackground="$chineseCyanLighter"
          onPress={() => router.push("/techniques/notes" as any)}
          disabled
        />
        <NotesModeCard
          title={t("techniquesModeNotes")}
          description={t("techniquesModeNotesDesc")}
          icon={<BookOpen size={25} />}
          borderColor="$chineseCyan"
          iconBackground="$chineseCyanLighter"
          onPress={() => router.push("/techniques/notes" as any)}
        />
      </YStack>
    </View>
  );
}
