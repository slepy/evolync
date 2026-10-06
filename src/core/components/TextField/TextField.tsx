import { danger, neutral } from "@/core/theme/tokens";
import { CircleAlert, Eye, EyeOff } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import type { TextInputProps } from "react-native";
import { Input, Text, View, XStack, YStack } from "tamagui";
import { resolveListAccent, type ListAccent } from "../List/accent";

export interface TextFieldProps {
  /** Uppercase field label above the input ("NAME"). */
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  /** Colors the focused border (module accent). */
  accent?: ListAccent;
  /** Muted line under the field; replaced by `error` when set. */
  hint?: string;
  error?: string;
  /** Red border without a message (the alert above the form explains it). */
  invalid?: boolean;
  /**
   * "form" (default): 56px on the card fill. "large": 52px on the page fill
   * with 17/700 text — the sign in / sign up / password reset fields.
   */
  size?: "form" | "large";
  /** Password: hidden text with a show / hide eye button on the right. */
  secure?: boolean;
  /** Under the input, before the hint (password rule chips). */
  footer?: ReactNode;
  disabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  onSubmitEditing?: () => void;
  returnKeyType?: TextInputProps["returnKeyType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  keyboardType?: TextInputProps["keyboardType"];
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
  /** Grows from 56px to fit several lines (descriptions). */
  multiline?: boolean;
}

/**
 * Form text field (board S select field geometry): 12/800 uppercase label,
 * 56px input on the card fill, 1.5px border in the module tint while focused.
 */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  accent = "neutral",
  hint,
  error,
  invalid,
  size = "form",
  secure,
  footer,
  disabled,
  autoFocus,
  maxLength,
  onSubmitEditing,
  returnKeyType,
  autoCapitalize,
  keyboardType,
  autoComplete,
  textContentType,
  multiline,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const tint = resolveListAccent(accent).tint;
  const large = size === "large";
  const note = error ?? hint;
  const errorColor = large ? "$alertDot" : "$trashText";
  const hasError = !!error || invalid;

  return (
    <YStack gap={8}>
      <Text fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted">
        {label}
      </Text>
      <XStack position="relative">
        <Input
          aria-label={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={neutral.placeholder}
          editable={!disabled}
          autoFocus={autoFocus}
          maxLength={maxLength}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          autoCapitalize={secure ? "none" : autoCapitalize}
          autoCorrect={secure ? false : undefined}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          textContentType={textContentType}
          secureTextEntry={secure && !revealed}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          unstyled
          flex={1}
          height={multiline ? undefined : large ? 52 : 56}
          minHeight={multiline ? 96 : undefined}
          paddingHorizontal={16}
          paddingRight={secure ? 56 : 16}
          paddingVertical={multiline ? 16 : undefined}
          textAlignVertical={multiline ? "top" : undefined}
          borderRadius={16}
          backgroundColor={large ? "$neutralPage" : "$neutralCard"}
          borderWidth={focused || hasError ? 1.5 : 1}
          borderColor={hasError ? errorColor : focused ? tint : "$neutralRaisedBorder"}
          color="$neutralText"
          fontSize={large ? 17 : 15}
          fontWeight={large ? "700" : "600"}
          opacity={disabled ? 0.6 : 1}
        />
        {secure ? (
          <View
            role="button"
            aria-label={revealed ? t("hidePassword") : t("showPassword")}
            onPress={() => setRevealed((v) => !v)}
            pressStyle={{ opacity: 0.7 }}
            position="absolute"
            right={4}
            top={large ? 4 : 6}
            width={44}
            height={44}
            borderRadius={14}
            alignItems="center"
            justifyContent="center"
          >
            {revealed ? <EyeOff size={20} color={neutral.muted} /> : <Eye size={20} color={neutral.muted} />}
          </View>
        ) : null}
      </XStack>
      {footer}
      {note ? (
        error && large ? (
          <XStack alignItems="center" gap={6}>
            <CircleAlert size={14} color={danger.text} strokeWidth={2.4} />
            <Text flex={1} fontSize={12.5} fontWeight="600" color="$trashText">
              {error}
            </Text>
          </XStack>
        ) : (
          <Text fontSize={12.5} fontWeight="$secondary" color={error ? "$trashText" : large ? "$neutralPlaceholder" : "$neutralMuted"}>
            {note}
          </Text>
        )
      ) : null}
    </YStack>
  );
}
