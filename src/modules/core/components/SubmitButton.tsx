import React from "react";
import { Button, Spinner } from "tamagui";

// ============================================================================
// Types
// ============================================================================

interface SubmitButtonProps {
  onPress: () => void;
  isLoading: boolean;
  disabled: boolean;
  title?: string;
}

// ============================================================================
// SubmitButton Component
// ============================================================================

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  onPress,
  isLoading,
  disabled,
  title,
}) => {
  const defaultTitle = title || t("signIn");

  return (
    <Button
      onPress={onPress}
      disabled={disabled || isLoading}
      size="$5"
      backgroundColor="$jadeGreen"
      color="$pearlWhite"
      borderRadius="$4"
      borderWidth={0}
      hoverStyle={{
        backgroundColor: "$jadeGreenLight",
        borderWidth: 0,
      }}
      pressStyle={{
        backgroundColor: "$jadeGreenDark",
        borderWidth: 0,
        scale: 0.98,
      }}
      disabledStyle={{
        backgroundColor: "$fillStrong",
        opacity: 0.6,
      }}
      icon={isLoading ? <Spinner color="$pearlWhite" /> : undefined}
      fontWeight="700"
      fontSize="$5"
      marginTop="$3"
      shadowColor="$jadeGreen"
      shadowOffset={{ width: 0, height: 4 }}
      shadowOpacity={0.3}
      shadowRadius={8}
      elevation={4}
    >
      {isLoading ? t("loading") : defaultTitle}
    </Button>
  );
};
