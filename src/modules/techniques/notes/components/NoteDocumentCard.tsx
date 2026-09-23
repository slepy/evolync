import { BaseCard, CardInfo, Thumbnail } from "@/modules/core/components";
import { FilterChip } from "@/modules/core/components";
import { useEntityTags } from "@/modules/tags/hooks";
import { BookOpen } from "lucide-react-native";
import React from "react";
import { XStack, YStack } from "tamagui";

interface NoteDocumentCardProps {
  id: string;
  title: string;
  description?: string | null;
  onPress: () => void;
}

export const NoteDocumentCard: React.FC<NoteDocumentCardProps> = ({
  id,
  title,
  description,
  onPress,
}) => {
  const { tags } = useEntityTags(id, "note_document");

  return (
    <BaseCard onPress={onPress}>
      <XStack gap="$3" alignItems="center">
        <Thumbnail
          borderColor="$chineseCyan"
          backgroundColor="$chineseCyanLighter"
          icon={<BookOpen />}
        />
        <YStack flex={1} gap="$1" pointerEvents="none">
          <CardInfo displayName={title} subtitle={description ?? undefined} />
          {tags.length > 0 && (
            <XStack gap="$1" flexWrap="wrap">
              {tags.map((tag) => (
                <FilterChip key={tag.id} label={tag.name} color={tag.color} />
              ))}
            </XStack>
          )}
        </YStack>
      </XStack>
    </BaseCard>
  );
};
