import React from "react";
import { Text, View, StyleSheet } from "react-native";
import type { ColorTokens } from "tamagui";
import { XStack, useTheme } from "tamagui";

import { BaseCard, CardInfo, Thumbnail } from "@/modules/core/components";

interface NotesModeCardProps {
  title: string;
  description: string;
  icon: React.ReactElement;
  iconBackground: ColorTokens;
  onPress: () => void;
  borderColor: ColorTokens;
  disabled?: boolean;
  comingSoonText?: string;
}

export const NotesModeCard: React.FC<NotesModeCardProps> = ({
  title,
  description,
  icon,
  iconBackground,
  borderColor,
  onPress,
  disabled = false,
  comingSoonText = t("comingSoon"),
}) => {
  const theme = useTheme();

  return (
    <BaseCard
      onPress={() => {
        if (!disabled) {
          onPress();
        }
      }}
      padding="$3"
      marginHorizontal="$0"
      opacity={disabled ? 0.7 : 1}
      borderColor={disabled ? "$gray7" : borderColor}
      backgroundColor="$surfaceTranslucent"
    >
      <XStack gap="$3" alignItems="center">
        <Thumbnail
          size={50}
          backgroundColor={disabled ? "$gray4" : iconBackground}
          borderColor={disabled ? "$gray7" : borderColor}
          borderRadius={10}
          icon={icon}
        />
        <CardInfo displayName={title} subtitle={description} />
      </XStack>

      {disabled && (
        <View pointerEvents="none" style={styles.watermark}>
          <Text style={[styles.watermarkText, { color: theme.textSecondary?.val }]}>{comingSoonText}</Text>
        </View>
      )}
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  watermark: {
    position: "absolute",
    right: 14,
    bottom: 10,
    transform: [{ rotate: "-12deg" }],
    opacity: 0.32,
  },
  watermarkText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "lowercase",
  },
});
