import type Sequence from "@/database/models/Sequence";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList } from "react-native";
import { Text } from "tamagui";
import { SequenceCard } from "./SequenceCard";

// ============================================================================
// Types
// ============================================================================

interface SequencesTabProps {
  sequences: Sequence[];
}

// ============================================================================
// SequencesTab Component
// ============================================================================

export const SequencesTab: React.FC<SequencesTabProps> = ({ sequences }) => {
  const router = useRouter();

  return (
    <FlatList
      data={sequences}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <SequenceCard
          sequence={item}
          onPress={() => router.push(`/techniques/threed/${item.id}` as any)}
        />
      )}
      ListEmptyComponent={
        <Text textAlign="center" color="$textSecondary" paddingVertical="$6">
          {t("threedNoSequences")}
        </Text>
      }
    />
  );
};
