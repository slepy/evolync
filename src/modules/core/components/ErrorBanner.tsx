import React from "react";
import { XStack, YStack, Text, Button } from "tamagui";
import { AlertCircle, X } from "lucide-react-native";

// ============================================================================
// Types
// ============================================================================

interface ErrorBannerProps {
  title: string;
  message?: string;
  onDismiss: () => void;
}

// ============================================================================
// ErrorBanner Component
// ============================================================================

/**
 * Reusable error banner component for displaying error messages with dismiss functionality.
 *
 * @example
 * <ErrorBanner
 *   title={t('errorInvalidCredentials')}
 *   message="Invalid email or password"
 *   onDismiss={() => clearError()}
 * />
 */
export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  title,
  message,
  onDismiss,
}) => {
  return (
    <YStack
      backgroundColor="#FEF2F2"
      borderColor="$imperialRed"
      borderWidth={2}
      borderRadius="$4"
      padding="$4"
      marginBottom="$5"
    >
      <XStack alignItems="flex-start" gap="$3">
        <AlertCircle size={22} color="#DC2626" style={{ marginTop: 2 }} />

        <YStack flex={1}>
          <Text color="$imperialRedDark" fontSize="$4" fontWeight="700">
            {title}
          </Text>

          {message && (
            <Text
              color="$imperialRed"
              fontSize="$3"
              marginTop="$2"
              fontWeight="500"
            >
              {message}
            </Text>
          )}
        </YStack>

        <Button
          width="$2"
          height="$2"
          chromeless
          onPress={onDismiss}
          icon={<X size={18} color="#DC2626" />}
        />
      </XStack>
    </YStack>
  );
};
