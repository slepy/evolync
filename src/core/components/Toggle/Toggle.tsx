import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { Text, View, XStack, YStack } from "tamagui";
import { resolveListAccent, type ListAccent } from "../List/accent";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible label ("Push notifications"). */
  label: string;
  disabled?: boolean;
  accent?: ListAccent;
}

/**
 * 52×32 switch (17A "Push notifications"): on = accent gradient with a dark
 * knob on the right, off = outlined track with a gray knob on the left.
 */
export function Toggle({ checked, onChange, label, disabled, accent = "light" }: ToggleProps) {
  const a = resolveListAccent(accent);

  return (
    <View
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled}
      onPress={disabled ? undefined : () => onChange(!checked)}
      pressStyle={disabled ? undefined : { opacity: 0.85 }}
      opacity={disabled ? 0.5 : 1}
      width={52}
      height={32}
      borderRadius={16}
      overflow="hidden"
      borderWidth={checked ? 0 : 1.5}
      borderColor="$neutralControl"
      backgroundColor={checked ? undefined : "$neutralPage"}
      flexShrink={0}
    >
      {checked ? (
        <>
          <LinearGradient colors={[a.from, a.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View position="absolute" top={3} right={3} width={26} height={26} borderRadius={13} backgroundColor={a.onGradient} />
        </>
      ) : (
        <View position="absolute" top={3.5} left={3.5} width={22} height={22} borderRadius={11} backgroundColor="$neutralControl" />
      )}
    </View>
  );
}

export interface ToggleRowProps extends ToggleProps {
  /** 16/800 row title ("Push notifications"). */
  title: string;
  /** Line under the title; `hintTone="danger"` paints it red (17B blocked). */
  hint?: string;
  hintTone?: "muted" | "danger";
}

/** Setting row: title and hint on the left, `Toggle` on the right (17A / 17B). */
export function ToggleRow({ title, hint, hintTone = "muted", ...toggle }: ToggleRowProps) {
  return (
    <XStack alignItems="center" gap={14} minHeight={56}>
      <YStack flex={1} minWidth={0} gap={3}>
        <Text fontSize="$rowTitle" fontWeight="$rowTitle" color="$neutralText">
          {title}
        </Text>
        {hint ? (
          <Text
            fontSize={13}
            fontWeight="$secondary"
            lineHeight={19}
            color={hintTone === "danger" ? "$trashText" : "$neutralMuted"}
          >
            {hint}
          </Text>
        ) : null}
      </YStack>
      <Toggle {...toggle} />
    </XStack>
  );
}
