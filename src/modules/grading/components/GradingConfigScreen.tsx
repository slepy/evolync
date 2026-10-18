import { ListCard, ListRow, ListSection, SubScreenPage } from "@/core/components";
import type GradingRank from "@/database/models/GradingRank";
import { LoadingScreen } from "@/core/components";
import { useStore } from "@/store";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, YStack } from "tamagui";
import { useGradingRanks } from "../hooks/useGradingRanks";
import { RankIcon } from "./RankIcon";
import { RankSheet } from "./RankSheet";

/**
 * Grading ranks list (8A): sub-screen header, "Your ranks" with Add new in
 * the Grading gray, one row per rank with its belt color. Add new opens the
 * add sheet (8B), a row opens the edit sheet (8C). `?create=1` opens add.
 */
export const GradingConfigScreen: React.FC = () => {
  const { create } = useLocalSearchParams<{ create?: string }>();
  const { organization } = useStore();
  const { ranks, isLoading } = useGradingRanks(organization?.id || "");
  const [sheetOpen, setSheetOpen] = useState(false);
  // Kept while the sheet closes so its title does not flip mid-animation.
  const [editedRank, setEditedRank] = useState<GradingRank | null>(null);

  const openSheet = (rank: GradingRank | null) => {
    setEditedRank(rank);
    setSheetOpen(true);
  };

  useEffect(() => {
    if (create) openSheet(null);
  }, [create]);

  if (isLoading || !organization) return <LoadingScreen />;

  return (
    <>
      <SubScreenPage title={t("gradingTitle")}>
        <ListSection
          title={t("gradingYourRanks")}
          accent="grading"
          action={{ label: t("addNew"), onPress: () => openSheet(null) }}
        >
          {ranks.length > 0 ? (
            <ListCard aria-label={t("gradingYourRanks")}>
              {ranks.map((rank) => (
                <ListRow
                  key={rank.id}
                  title={rank.name}
                  leading={<RankIcon color={rank.color} />}
                  onPress={() => openSheet(rank)}
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
                {t("gradingEmptyState")}
              </Text>
            </YStack>
          )}
        </ListSection>
      </SubScreenPage>

      <RankSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        organizationId={organization.id}
        rank={editedRank}
      />
    </>
  );
};
