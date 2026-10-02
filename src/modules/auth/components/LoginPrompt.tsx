import React from "react";
import { XStack, Text, Button } from "tamagui";

// ============================================================================
// Types
// ============================================================================

interface LoginPromptProps {
  onNavigate: () => void;
}

// ============================================================================
// LoginPrompt Component
// ============================================================================

export const LoginPrompt: React.FC<LoginPromptProps> = ({ onNavigate }) => {
  return (
    <XStack justifyContent="center" alignItems="center" gap="$2" marginTop="$7">
      <Text color="$textSecondary" fontSize="$4" fontWeight="500">
        {t("alreadyHaveAccount")}
      </Text>
      <Button
        onPress={onNavigate}
        size="$4"
        chromeless
        color="$imperialRed"
        fontWeight="700"
        hoverStyle={{
          backgroundColor: "rgba(220, 38, 38, 0.1)",
        }}
        pressStyle={{
          backgroundColor: "rgba(220, 38, 38, 0.15)",
        }}
      >
        {t("signIn")}
      </Button>
    </XStack>
  );
};
