import React from "react";
import { ScrollView } from "react-native";
import { Sheet, Text, YStack } from "tamagui";

import type Technique from "@/database/models/Technique";
import { TechniqueCard } from "./TechniqueCard";

interface TechniqueLibrarySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  techniques: Technique[];
  filterBodyPart: string | null;
  onSelect: (technique: Technique) => void;
}

export const TechniqueLibrarySheet: React.FC<TechniqueLibrarySheetProps> = ({
  open,
  onOpenChange,
  techniques,
  filterBodyPart,
  onSelect,
}) => {
  const filtered = filterBodyPart
    ? techniques.filter(
        (t) => t.bodyPart === filterBodyPart || t.bodyPart === "fullbody",
      )
    : techniques;

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[70]}
      dismissOnSnapToBottom
      zIndex={200}
    >
      <Sheet.Overlay
        backgroundColor="rgba(0, 0, 0, 0.5)"
        opacity={0.5}
        zIndex={199}
      />
      <Sheet.Frame
        padding="$4"
        backgroundColor="$background"
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
        zIndex={200}
      >
        <Sheet.Handle />
        <YStack gap="$3" flex={1}>
          <Text fontSize="$5" fontWeight="700" color="$textPrimary">
            {t("threedTechniques")}
          </Text>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <YStack gap="$1">
              {filtered.length === 0 ? (
                <Text
                  fontSize="$3"
                  color="$textSecondary"
                  textAlign="center"
                  paddingVertical="$4"
                >
                  {t("threedNoTechniques")}
                </Text>
              ) : (
                filtered.map((technique) => (
                  <TechniqueCard
                    key={technique.id}
                    technique={technique}
                    onPress={() => {
                      onSelect(technique);
                      onOpenChange(false);
                    }}
                  />
                ))
              )}
            </YStack>
          </ScrollView>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
};
