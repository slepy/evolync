import React from "react";
import { Button, Text, YStack, XStack, ScrollView } from "tamagui";
import { X } from "lucide-react-native";
import { BaseCard } from "@/modules/core/components";
import type Technique from "@/database/models/Technique";

interface StartingPositionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  positions: Technique[];
  onSelect: (position: Technique) => void;
}

export const StartingPositionSheet: React.FC<StartingPositionSheetProps> = ({
  open,
  onOpenChange,
  positions,
  onSelect,
}) => {
  const handleSelect = (position: Technique) => {
    onSelect(position);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <YStack
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="$background"
      zIndex={999}
      flex={1}
    >
      {/* Header */}
      <XStack
        padding="$4"
        justifyContent="space-between"
        alignItems="center"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <Text fontSize="$5" fontWeight="700" color="$textPrimary">
          {t("threedStartingPositions")}
        </Text>
        <Button
          size="$2"
          icon={<X size={20} />}
          chromeless
          onPress={() => onOpenChange(false)}
        />
      </XStack>

      {/* Content */}
      <ScrollView flex={1} padding="$4">
        <YStack gap="$3">
          {positions.length === 0 ? (
            <YStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              paddingVertical="$8"
            >
              <Text fontSize="$3" color="$colorSubtle">
                {t("threedNoTechniques")}
              </Text>
            </YStack>
          ) : (
            positions.map((position) => (
              <BaseCard
                key={position.id}
                onPress={() => handleSelect(position)}
              >
                <YStack gap="$2" width="100%">
                  <Text fontSize="$4" fontWeight="600" color="$color">
                    {position.title}
                  </Text>
                  {position.createdAt && (
                    <Text fontSize="$2" color="$colorSubtle">
                      {new Date(position.createdAt).toLocaleDateString()}
                    </Text>
                  )}
                </YStack>
              </BaseCard>
            ))
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
};
