import React from "react";
import { Image } from "react-native";
import { Text, YStack } from "tamagui";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const splashIcon = require("../../../../assets/images/logo.png");

// ============================================================================
// Types
// ============================================================================

interface AppLogoProps {
  /** Size of the logo icon */
  size?: number;
  /** Show app name text below logo */
  showText?: boolean;
  /** Show decorative accent line */
  showAccent?: boolean;
}

// ============================================================================
// AppLogo Component
// ============================================================================

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 100,
  showText = true,
}) => {
  return (
    <YStack
      alignItems="center"
      justifyContent="center"
      marginBottom={showText ? "$6" : 0}
    >
      <Image
        source={splashIcon}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />

      {/* App name with elegant typography */}
      {showText && (
        <Text
          marginTop="$4"
          fontSize="$8"
          fontWeight="700"
          color="$textPrimary"
          letterSpacing={1}
        >
          Evolync
        </Text>
      )}
    </YStack>
  );
};
