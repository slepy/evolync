import type Technique from "@/database/models/Technique";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList } from "react-native";
import { Text } from "tamagui";
import { TechniqueCard } from "./TechniqueCard";

// ============================================================================
// Types
// ============================================================================

interface StartingPositionsTabProps {
  positions: Technique[];
}

// ============================================================================
// StartingPositionsTab Component
// ============================================================================

export const StartingPositionsTab: React.FC<StartingPositionsTabProps> = ({
  positions,
}) => {
  const router = useRouter();

  return (
    <FlatList
      data={positions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TechniqueCard
          technique={item}
          onPress={() => router.push(`/techniques/threed/technique/${item.id}` as any)}
        />
      )}
      ListEmptyComponent={
        <Text textAlign="center" color="$textSecondary" paddingVertical="$6">
          {t("threedNoTechniques")}
        </Text>
      }
    />
  );
};
