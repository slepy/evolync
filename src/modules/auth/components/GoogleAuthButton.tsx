import React from "react";
import { Button, Spinner, XStack, Text } from "tamagui";

// ============================================================================
// Types
// ============================================================================

interface GoogleAuthButtonProps {
  onPress: () => void;
  isLoading: boolean;
  disabled: boolean;
}

// ============================================================================
// GoogleAuthButton Component
// ============================================================================

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onPress,
  isLoading,
  disabled,
}) => {
  return (
    <Button
      onPress={onPress}
      disabled={disabled || isLoading}
      size="$5"
      backgroundColor="$pearlWhite"
      borderColor="$softGrayLight"
      borderWidth={2}
      borderRadius="$4"
      hoverStyle={{
        backgroundColor: "white",
        borderColor: "$softGray",
      }}
      pressStyle={{
        backgroundColor: "$pearlWhite",
        borderColor: "$softGray",
        scale: 0.98,
      }}
      disabledStyle={{
        backgroundColor: "$pearlWhite",
        opacity: 0.5,
      }}
      icon={
        isLoading ? (
          <Spinner color="$softGray" />
        ) : (
          <XStack
            width={24}
            height={24}
            backgroundColor="$pearlWhite"
            borderRadius="$12"
            alignItems="center"
            justifyContent="center"
            borderWidth={1}
            borderColor="$softGrayLight"
          >
            <Text fontSize="$6" fontWeight="700" color="$softGrayDark">
              G
            </Text>
          </XStack>
        )
      }
      shadowColor="$softGray"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={4}
      elevation={2}
    >
      <Text color="$softGrayDark" fontWeight="600" fontSize="$4">
        {isLoading ? t("loading") : t("continueWithGoogle")}
      </Text>
    </Button>
  );
};
