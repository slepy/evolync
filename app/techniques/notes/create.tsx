import { Header, HeaderTitle } from "@/modules/core/components";
import { setTagsForEntity } from "@/modules/tags/services";
import { NoteDocumentForm } from "@/modules/techniques/notes/components";
import type { LocalRow } from "@/modules/techniques/notes/components";
import { addNoteRow, createNoteDocument, updateNoteRow } from "@/modules/techniques/notes/services";
import { NoteRowRepository } from "@/modules/techniques/notes/repositories";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NoteCreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useStore();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async ({
    title,
    tagIds,
    rows,
  }: {
    title: string;
    tagIds: string[];
    rows: LocalRow[];
    deletedRowIds: string[];
    newRowIds: Set<string>;
  }) => {
    if (!user || isSaving) return;
    try {
      setIsSaving(true);
      // createNoteDocument creates one default empty row
      const doc = await createNoteDocument({ userId: user.id, title });

      if (tagIds.length > 0) {
        await setTagsForEntity(tagIds, doc.id, "note_document");
      }

      // Update the default row with the first form row's data
      const defaultRows = await NoteRowRepository.findByDocumentId(doc.id);
      const firstFormRow = rows[0];
      if (defaultRows[0] && firstFormRow) {
        await updateNoteRow(defaultRows[0].id, {
          person1Text: firstFormRow.person1Text,
          person2Text: firstFormRow.person2Text,
          direction: firstFormRow.direction,
        });
      }

      // Add remaining rows
      for (const row of rows.slice(1)) {
        await addNoteRow(doc.id, {
          person1Text: row.person1Text,
          person2Text: row.person2Text,
          direction: row.direction,
        });
      }

      router.replace(`/techniques/notes/${doc.id}` as any);
    } catch (err) {
      console.error("[NoteCreateScreen] Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("notesNewDocument")} />}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <NoteDocumentForm
          onSave={handleSave}
          isSaving={isSaving}
          saveLabel={t("notesCreateDocument")}
        />
      </KeyboardAvoidingView>
    </View>
  );
}
