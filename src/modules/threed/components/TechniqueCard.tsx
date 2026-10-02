import React from "react";
import { XStack } from "tamagui";

import type Technique from "@/database/models/Technique";
import { BaseCard, CardInfo, Thumbnail } from "@/modules/core/components";
import { PersonStanding } from "lucide-react-native";

interface TechniqueCardProps {
  technique: Technique;
  onPress?: () => void;
}

export const TechniqueCard: React.FC<TechniqueCardProps> = ({
  technique,
  onPress,
}) => {
  return (
    <BaseCard onPress={onPress ?? (() => {})}>
      <XStack gap="$3" alignItems="center">
        <Thumbnail
          size={30}
          iconSize={15}
          icon={<PersonStanding />}
          borderColor="$chineseCyan"
          backgroundColor="$infoSurface"
        />

        <CardInfo
          displayName={technique.title}
          subtitle={technique.description}
        />
      </XStack>
    </BaseCard>
  );
};
