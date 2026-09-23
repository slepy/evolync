import { FilterChip } from "@/modules/core/components";
import React from "react";
import { ScrollView } from "react-native";
import type Tag from "@/database/models/Tag";

interface TagFilterBarProps {
  tags: Tag[];
  activeTagId: string | null;
  onSelect: (tagId: string | null) => void;
}

export const TagFilterBar: React.FC<TagFilterBarProps> = ({
  tags,
  activeTagId,
  onSelect,
}) => {
  if (tags.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginTop: 8,
        gap: 8,
      }}
    >
      <FilterChip
        label={t("tagsAll")}
        active={activeTagId === null}
        onPress={() => onSelect(null)}
      />
      {tags.map((tag) => {
        const isActive = activeTagId === tag.id;
        return (
          <FilterChip
            key={tag.id}
            label={tag.name}
            color={tag.color}
            active={isActive}
            onPress={() => onSelect(isActive ? null : tag.id)}
          />
        );
      })}
    </ScrollView>
  );
};
