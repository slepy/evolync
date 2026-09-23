import { PersonStanding } from "lucide-react-native";
import React from "react";
import { XStack } from "tamagui";

import type Sequence from "@/database/models/Sequence";
import { BaseCard, CardInfo } from "@/modules/core/components";
import { Thumbnail } from "@/modules/core/components";

interface SequenceCardProps {
  sequence: Sequence;
  onPress: () => void;
}

export const SequenceCard: React.FC<SequenceCardProps> = ({
  sequence,
  onPress,
}) => {
  return (
    <BaseCard onPress={onPress}>
      <XStack gap="$3" alignItems="center">
        <Thumbnail icon={<PersonStanding size={20} />} />

        <CardInfo
          displayName={sequence.title}
          subtitle={sequence.description}
        />
      </XStack>
    </BaseCard>
  );
};
