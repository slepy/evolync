import {
  Header,
  HeaderTitle,
  LoadingScreen,
} from "@/modules/core/components";
import { OptionsSheet } from "@/modules/core/components/OptionsSheet";
import { TagFilterBar, useTags } from "@/modules/tags";
import { NoteDocumentCard } from "@/modules/techniques/notes/components";
import { useNoteDocumentsByTag } from "@/modules/techniques/notes/hooks";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { FlatList, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";

export default function NotesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const { documents, isLoading } = useNoteDocumentsByTag(activeTagId);
  const { tags } = useTags();

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("notesTitle")} />}
      />

      <TagFilterBar tags={tags} activeTagId={activeTagId} onSelect={setActiveTagId} />

      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => (
          <NoteDocumentCard
            id={item.id}
            title={item.title}
            description={item.description}
            onPress={() => router.push(`/techniques/notes/${item.id}` as any)}
          />
        )}
        ListEmptyComponent={
          <YStack
            flex={1}
            alignItems="center"
            justifyContent="center"
            paddingVertical="$8"
            paddingHorizontal="$6"
          >
            <Text fontSize="$4" color="$textSecondary" textAlign="center">
              {t("notesNoDocuments")}
            </Text>
          </YStack>
        }
      />

      <OptionsSheet
        fab={{
          bottom: Platform.OS === "ios" ? 90 : 80,
          right: 20,
        }}
        action={() => router.push("/techniques/notes/create" as any)}
      />
    </View>
  );
}
