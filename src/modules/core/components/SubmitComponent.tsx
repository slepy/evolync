import React from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, YStack } from "tamagui";
import { SubmitButton } from "./SubmitButton";

// ============================================================================
// Types
// ============================================================================

interface SubmitComponentProps {
  onPress?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  title?: string;
  children?: React.ReactNode;
}

// ============================================================================
// SubmitComponent Component
// ============================================================================

export const SubmitComponent: React.FC<SubmitComponentProps> = ({
  onPress,
  isLoading,
  disabled,
  title,
  children,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      padding="$4"
      paddingTop="$2"
      paddingBottom={
        Platform.OS === "android" ? Math.max(insets.bottom, 26) : undefined
      }
      backgroundColor="$background"
      borderTopWidth={1}
      borderTopColor="$borderColor"
      shadowColor="black"
      shadowOffset={{ width: 0, height: -2 }}
      shadowOpacity={0.05}
      shadowRadius={4}
      zIndex={100}
    >
      <YStack maxWidth={500} width="100%" alignSelf="center" gap="$2">
        {children ?? (
          <SubmitButton
            onPress={onPress!}
            isLoading={isLoading!}
            disabled={disabled!}
            title={title || t("save")}
          />
        )}
      </YStack>
    </View>
  );
};
