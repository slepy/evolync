import React from 'react';
import { XStack, Separator, Text } from 'tamagui';

// ============================================================================
// Types
// ============================================================================

interface DividerProps {
  text?: string;
}

// ============================================================================
// Divider Component
// ============================================================================

export const Divider: React.FC<DividerProps> = ({ text = t('or') }) => {
  return (
    <XStack alignItems="center" gap="$3" marginVertical="$5">
      <Separator flex={1} backgroundColor="$softGrayLight" />
      <Text color="$softGray" fontSize="$3" fontWeight="600" letterSpacing={0.5}>
        {text}
      </Text>
      <Separator flex={1} backgroundColor="$softGrayLight" />
    </XStack>
  );
};
