import { BaseCard } from "@/modules/core/components";
import { Package, Plus } from "lucide-react-native";
import React from "react";
import type { ColorTokens } from "tamagui";
import { Button, Image, Text, XStack, YStack, useTheme } from "tamagui";

// ============================================================================
// Types
// ============================================================================

interface ProductPickerCardProps {
  name: string;
  imageUrl?: string | null;
  variantsCount: number;
  lowestPrice: string;
  onPress: () => void;
}

// ============================================================================
// ProductPickerCard Component
// ============================================================================

export const ProductPickerCard: React.FC<ProductPickerCardProps> = ({
  name,
  imageUrl,
  variantsCount,
  lowestPrice,
  onPress,
}) => {
  const theme = useTheme();
  const iconColor: ColorTokens = "$purple10";
  const resolvedIconColor = iconColor.startsWith("$")
    ? theme[iconColor.slice(1)]?.val || iconColor
    : iconColor;

  return (
    <BaseCard onPress={onPress}>
      <XStack gap="$3" alignItems="center">
        {/* Icon/Image Container */}
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl, width: 40, height: 40 }}
            width={40}
            height={40}
            borderRadius="$4"
            borderWidth={1}
            borderColor="$softGray"
            objectFit="cover"
            backgroundColor="$softGrayLight"
          />
        ) : (
          <XStack
            width={40}
            height={40}
            backgroundColor="$purple3"
            borderRadius="$4"
            justifyContent="center"
            alignItems="center"
            borderWidth={1}
            borderColor={iconColor}
            pointerEvents="none"
          >
            <Package size={20} color={resolvedIconColor} strokeWidth={2.5} />
          </XStack>
        )}

        {/* Content */}
        <YStack flex={1} gap="$1">
          <Text
            fontSize="$4"
            fontWeight="600"
            color="$inkBlack"
            numberOfLines={1}
          >
            {name}
          </Text>

          <XStack gap="$2" alignItems="center">
            <Text fontSize="$3" color="$softGrayDark" fontWeight="600">
              {variantsCount > 1 ? `${t("from")} ${lowestPrice}` : lowestPrice}
            </Text>
            {variantsCount > 1 && (
              <Text fontSize="$2" color="$softGray">
                {variantsCount} {t("inventoryVariants")}
              </Text>
            )}
          </XStack>
        </YStack>

        {/* Add Button */}
        <Button
          width="$3"
          height="$3"
          backgroundColor="$purple11"
          pressStyle={{ scale: 0.95 }}
          pointerEvents="none"
        >
          <Plus size={18} color={theme.pearlWhite?.val} pointerEvents="none" />
        </Button>
      </XStack>
    </BaseCard>
  );
};
