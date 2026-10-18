import {
  ChipFilter,
  EmptyState,
  ListCard,
  ListEmpty,
  ListIcon,
  ListRow,
  ListSection,
  SearchField,
  SubScreenPage,
  TagChip,
} from "@/core/components";
import { LoadingScreen } from "@/core/components";
import { useRouter } from "expo-router";
import { BookOpen, FileText } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { useNoteList } from "../hooks";
import { ALL_TAGS, filterNotes, formatNoteDate } from "../noteList";

/**
 * Descriptive notes (T2): search, tag filter in Tags rose, "Your notes" with
 * Add new in Notebook cyan, one row per note with its date and tags. T2F is
 * the same list filtered by a tag; T2E the empty notebook.
 */
export function NotesListScreen() {
  const router = useRouter();
  const { notes, tags, isLoading } = useNoteList();
  const [query, setQuery] = useState("");
  const [tagId, setTagId] = useState<string>(ALL_TAGS);

  // A filter on a tag deleted meanwhile falls back to All.
  const activeTagId = tagId === ALL_TAGS || tags.some((tag) => tag.id === tagId) ? tagId : ALL_TAGS;
  const visible = useMemo(() => filterNotes(notes, query, activeTagId), [notes, query, activeTagId]);
  const openCreate = () => router.push("/techniques/notes/create" as any);

  if (isLoading) return <LoadingScreen />;

  if (notes.length === 0) {
    return (
      <SubScreenPage title={t("notesTitle")}>
        <EmptyState
          icon={BookOpen}
          accent="notebook"
          title={t("notesNoDocuments")}
          text={t("notesEmptyHint")}
          action={{ label: t("addNew"), onPress: openCreate }}
        />
      </SubScreenPage>
    );
  }

  return (
    <SubScreenPage title={t("notesTitle")}>
      <SearchField value={query} onChangeText={setQuery} placeholder={t("notesSearch")} accent="notebook" />
      {tags.length > 0 ? (
        <ChipFilter
          aria-label={t("tagsPicker")}
          accent="tags"
          value={activeTagId}
          onChange={setTagId}
          options={[{ value: ALL_TAGS, label: t("tagsAll") }, ...tags.map((tag) => ({ value: tag.id, label: tag.name }))]}
        />
      ) : null}

      <ListSection title={t("notesYourNotes")} accent="notebook" action={{ label: t("addNew"), onPress: openCreate }}>
        {visible.length > 0 ? (
          <ListCard aria-label={t("notesYourNotes")}>
            {visible.map((note) => (
              <ListRow
                key={note.id}
                title={note.title}
                subtitle={formatNoteDate(note.createdAt, t("locale"))}
                leading={<ListIcon icon={FileText} accent="notebook" />}
                meta={note.tags.length > 0 ? note.tags.map((tag) => <TagChip key={tag.id} label={tag.name} />) : undefined}
                onPress={() => router.push(`/techniques/notes/${note.id}` as any)}
              />
            ))}
          </ListCard>
        ) : (
          <ListEmpty text={t("notesNoMatch")} hint={t("notesNoMatchHint")} />
        )}
      </ListSection>
    </SubScreenPage>
  );
}
