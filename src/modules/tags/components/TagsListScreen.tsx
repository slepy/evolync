import {
  ListCard,
  ListChip,
  ListIcon,
  ListRow,
  ListSection,
  SubScreenPage,
} from "@/core/components";
import type Tag from "@/database/models/Tag";
import { LoadingScreen } from "@/modules/core/components";
import { useLocalSearchParams } from "expo-router";
import { Tag as TagIcon } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Text, YStack } from "tamagui";
import { useTagUsageCounts, useTags } from "../hooks";
import { TagSheet } from "./TagSheet";

/**
 * Tags list (7A): sub-screen header, "Your tags" with Add new in the Tags
 * rose, one row per tag with its usage count. Add new opens the create sheet
 * (7B), a row opens the edit sheet (7C). `?create=1` opens the create sheet.
 */
export const TagsListScreen: React.FC = () => {
  const { create } = useLocalSearchParams<{ create?: string }>();
  const { tags, isLoading } = useTags();
  const tagIds = useMemo(() => tags.map((tag) => tag.id), [tags]);
  const counts = useTagUsageCounts(tagIds);
  const [sheetOpen, setSheetOpen] = useState(false);
  // Kept while the sheet closes so its title does not flip mid-animation.
  const [editedTag, setEditedTag] = useState<Tag | null>(null);

  const openSheet = (tag: Tag | null) => {
    setEditedTag(tag);
    setSheetOpen(true);
  };

  useEffect(() => {
    if (create) openSheet(null);
  }, [create]);

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <SubScreenPage title={t("tagsPicker")}>
        <ListSection
          title={t("tagsYourTags")}
          accent="tags"
          action={{ label: t("addNew"), onPress: () => openSheet(null) }}
        >
          {tags.length > 0 ? (
            <ListCard aria-label={t("tagsYourTags")}>
              {tags.map((tag) => (
                <ListRow
                  key={tag.id}
                  title={tag.name}
                  leading={<ListIcon icon={TagIcon} accent="tags" />}
                  trailing={counts[tag.id] ? <ListChip label={String(counts[tag.id])} /> : undefined}
                  onPress={() => openSheet(tag)}
                />
              ))}
            </ListCard>
          ) : (
            <YStack
              padding={20}
              borderRadius="$card"
              borderWidth={1}
              borderColor="$neutralCardBorder"
              backgroundColor="$neutralCard"
            >
              <Text fontSize="$secondary" fontWeight="$secondary" color="$neutralMuted" textAlign="center">
                {t("tagsEmpty")}
              </Text>
            </YStack>
          )}
        </ListSection>
      </SubScreenPage>

      <TagSheet
        open={sheetOpen}
        tag={editedTag}
        onOpenChange={setSheetOpen}
      />
    </>
  );
};
