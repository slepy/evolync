import React from 'react';
import { Spinner, YStack } from 'tamagui';
import { AppLogo } from './AppLogo';

// ============================================================================
// Types
// ============================================================================

export interface LoadingScreenProps {
  /** Show the app logo */
  showLogo?: boolean;
  /** Size of the logo */
  logoSize?: number;
  /** Color of the loading spinner */
  spinnerColor?: string;
  /** Size of the loading spinner */
  spinnerSize?: 'small' | 'large';
}

// ============================================================================
// LoadingScreen Component
// ============================================================================

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  showLogo = true,
  logoSize = 100,
  spinnerColor = '$imperialRed',
  spinnerSize = 'large',
}) => {
  return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
        {showLogo && <AppLogo size={logoSize} showText={false} showAccent={true} />}
        <Spinner size={spinnerSize} color={spinnerColor} />
      </YStack>
  );
};
