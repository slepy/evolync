import { ListCard, ListChip, ListIcon, ListRow, ListSection, MainNav, TabPage } from "@/core/components";
import { useNoteList } from "@/modules/techniques/notes/hooks";
import { useRouter } from "expo-router";
import { BookOpen, Box, Video } from "lucide-react-native";
import React from "react";

/**
 * Notebook tab (T1): "Ways to write" — Descriptive notes in Notebook cyan with
 * the note count, 3D and Video in neutral gray marked SOON.
 */
export function NotebookScreen() {
  const router = useRouter();
  const { notes, isLoading } = useNoteList();
  const soon = <ListChip label={t("notebookSoon")} />;

  return (
    <TabPage title={t("navNotebook")} nav={<MainNav />}>
      <ListSection title={t("notebookWaysToWrite")}>
        <ListCard aria-label={t("notebookWaysToWrite")}>
          <ListRow
            title={t("techniquesModeNotes")}
            subtitle={t("techniquesModeNotesDesc")}
            leading={<ListIcon icon={BookOpen} accent="notebook" />}
            trailing={isLoading ? undefined : <ListChip label={String(notes.length)} accent="notebook" />}
            onPress={() => router.push("/techniques/notes" as any)}
          />
          <ListRow
            title={t("techniquesModeThreeD")}
            subtitle={t("techniquesModeThreeDDesc")}
            leading={<ListIcon icon={Box} />}
            trailing={soon}
          />
          <ListRow
            title={t("techniquesModeVideo")}
            subtitle={t("techniquesModeVideoDesc")}
            leading={<ListIcon icon={Video} />}
            trailing={soon}
          />
        </ListCard>
      </ListSection>
    </TabPage>
  );
}
