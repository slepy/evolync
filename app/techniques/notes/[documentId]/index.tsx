import {
  Header,
  HeaderTitle,
  LoadingScreen,
} from "@/modules/core/components";
import { setTagsForEntity } from "@/modules/tags/services";
import { NoteDocumentForm } from "@/modules/techniques/notes/components";
import type { LocalRow } from "@/modules/techniques/notes/components";
import { useNoteRows } from "@/modules/techniques/notes/hooks";
import { NoteDocumentRepository } from "@/modules/techniques/notes/repositories";
import {
  addNoteRow,
  deleteNoteDocument,
  deleteNoteRow,
  updateNoteDocument,
  updateNoteRow,
} from "@/modules/techniques/notes/services";
import { confirmDelete } from "@/modules/core/utils/confirmDelete";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, useTheme } from "tamagui";
import type TechniqueNoteDocument from "@/database/models/TechniqueNoteDocument";
import type TechniqueNoteRow from "@/database/models/TechniqueNoteRow";
import type { AttackDirection } from "@/modules/techniques/notes/types";

function toLocalRow(row: TechniqueNoteRow): LocalRow {
  return {
    id: row.id,
    person1Text: row.person1Text,
    person2Text: row.person2Text,
    direction: row.direction as AttackDirection,
  };
}

export default function NoteDocumentScreen() {
  const { documentId } = useLocalSearchParams<{ documentId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { rows, isLoading } = useNoteRows(documentId);
  const [document, setDocument] = useState<TechniqueNoteDocument | null>(null);
  const [initialRows, setInitialRows] = useState<LocalRow[] | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!documentId) return;
    NoteDocumentRepository.findById(documentId).then((doc) => {
      setDocument(doc);
    });
  }, [documentId]);

  useEffect(() => {
    if (!isLoading && initialRows === undefined) {
      setInitialRows(rows.map(toLocalRow));
    }
  }, [isLoading, initialRows, rows]);

  const handleSave = async ({
    title,
    tagIds,
    rows: localRows,
    deletedRowIds,
    newRowIds,
  }: {
    title: string;
    tagIds: string[];
    rows: LocalRow[];
    deletedRowIds: string[];
    newRowIds: Set<string>;
  }) => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      await updateNoteDocument(documentId, { title });
      await setTagsForEntity(tagIds, documentId, "note_document");

      const existingRows = localRows.filter((r) => !newRowIds.has(r.id));
      const pendingNewRows = localRows.filter((r) => newRowIds.has(r.id));

      await Promise.all([
        ...deletedRowIds.map((id) => deleteNoteRow(id)),
        ...existingRows.map((row) =>
          updateNoteRow(row.id, {
            person1Text: row.person1Text,
            person2Text: row.person2Text,
            direction: row.direction,
          }),
        ),
        ...pendingNewRows.map((row) =>
          addNoteRow(documentId, {
            person1Text: row.person1Text,
            person2Text: row.person2Text,
            direction: row.direction,
          }),
        ),
      ]);

      setDocument((prev) => (prev ? { ...prev, title } as TechniqueNoteDocument : prev));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDocument = () => {
    confirmDelete(
      t("notesDeleteDocument"),
      t("notesDeleteDocumentConfirm"),
      async () => {
        await deleteNoteDocument(documentId);
        router.back();
      },
    );
  };

  if (isLoading || initialRows === undefined) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={
          <HeaderTitle text={document?.title ?? t("notesTitle")} />
        }
        rightContent={
          <Button
            width="$4"
            height="$4"
            chromeless
            pressStyle={{ scale: 0.95, backgroundColor: "$dangerSurface" }}
            onPress={handleDeleteDocument}
            icon={
              <Trash2
                size={20}
                color={theme.dangerText?.val}
                pointerEvents="none"
              />
            }
          />
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <NoteDocumentForm
          documentId={documentId}
          initialTitle={document?.title ?? ""}
          initialRows={initialRows}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </KeyboardAvoidingView>
    </View>
  );
}
