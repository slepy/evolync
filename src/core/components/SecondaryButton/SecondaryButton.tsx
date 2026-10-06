import { Text, XStack } from "tamagui";

export interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  /**
   * "lg" (default): full-width 52px outlined button under a primary one (N5 "Not now").
   * "sm": 44px raised pill sized to its label (17B "Open device settings").
   */
  size?: "lg" | "sm";
  disabled?: boolean;
}

/** Neutral outlined button for the second action of a sheet or card. */
export function SecondaryButton({ label, onPress, size = "lg", disabled }: SecondaryButtonProps) {
  const lg = size === "lg";

  return (
    <XStack
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      onPress={disabled ? undefined : onPress}
      pressStyle={disabled ? undefined : { opacity: 0.85 }}
      opacity={disabled ? 0.5 : 1}
      width={lg ? "100%" : undefined}
      alignSelf={lg ? undefined : "flex-start"}
      height={lg ? 52 : 44}
      paddingHorizontal={18}
      borderRadius={lg ? 26 : 22}
      borderWidth={1}
      borderColor="$neutralRaisedBorder"
      backgroundColor={lg ? "$neutralCard" : "$neutralRaised"}
      alignItems="center"
      justifyContent="center"
    >
      <Text fontSize={lg ? 15 : 14} fontWeight="$button" color="$neutralText" numberOfLines={1}>
        {label}
      </Text>
    </XStack>
  );
}
