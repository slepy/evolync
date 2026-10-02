import { BaseCard, CardInfo, Thumbnail } from "@/modules/core/components";
import { Award } from "lucide-react-native";
import React from "react";
import { XStack } from "tamagui";

interface RankListItemProps {
  id: string;
  name: string;
  color?: string | null;
  onPress: () => void;
}

export const RankListItem: React.FC<RankListItemProps> = ({
  name,
  color,
  onPress,
}) => {
  return (
    <BaseCard onPress={onPress} marginHorizontal={16}>
      <XStack gap="$3" alignItems="center">
        <Thumbnail
          icon={<Award />}
          borderColor={"white"}
          backgroundColor={color || "$fillMuted"}
        />
        <CardInfo displayName={name} />
      </XStack>
    </BaseCard>
  );
};
