import { danger, neutral } from "@/core/theme/tokens";
import { CircleAlert, Eye, EyeOff, Lock, type LucideIcon } from "lucide-react-native";
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
   * "form" (default): 56px. "large": 52px on the page fill with 17/700 text —
   * the sign in / sign up / password reset fields.
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
  /** Muted 18px icon in front of the value (15A ADDRESS: map pin). */
  icon?: LucideIcon;
  /** Inside a `FormCard`: page fill instead of the card fill (15A, 16E RANK). */
  inset?: boolean;
  /**
   * Read-only value (P1 sign-in EMAIL): dashed border, no fill, muted text and
   * a lock on the right; `hint` says why it can't be changed.
   */
  locked?: boolean;
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
  icon: Icon,
  inset,
  locked,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const tint = resolveListAccent(accent).tint;
  const large = size === "large";
  const note = error ?? hint;
  const hasError = !!error || invalid;
  const errorColor = large ? "$alertDot" : "$trashText";
  const height = large ? 52 : 56;
  const hasTrailing = !!Icon || secure || locked;

  return (
    <YStack gap={8}>
      <Text fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted">
        {label}
      </Text>
      <XStack
        alignItems={multiline ? "flex-start" : "center"}
        gap={10}
        height={multiline ? undefined : height}
        minHeight={multiline ? 96 : undefined}
        paddingLeft={16}
        paddingRight={Icon || locked ? 16 : secure ? 4 : 0}
        borderRadius={16}
        backgroundColor={locked ? "transparent" : inset || large ? "$neutralPage" : "$neutralCard"}
        borderWidth={focused || hasError ? 1.5 : 1}
        borderStyle={locked ? "dashed" : "solid"}
        borderColor={hasError ? errorColor : focused ? tint : "$neutralRaisedBorder"}
        opacity={disabled ? 0.6 : 1}
      >
        {Icon ? <Icon size={18} color={neutral.muted} strokeWidth={2} /> : null}
        <Input
          flex={1}
          aria-label={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={neutral.placeholder}
          editable={!disabled && !locked}
          aria-readonly={locked}
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
          height={multiline ? undefined : height - 2}
          minHeight={multiline ? 94 : undefined}
          paddingRight={hasTrailing ? 0 : 16}
          paddingVertical={multiline ? 16 : undefined}
          textAlignVertical={multiline ? "top" : undefined}
          color={locked ? "$neutralMuted" : "$neutralText"}
          fontSize={large ? 17 : 15}
          fontWeight={large ? "700" : "600"}
        />
        {secure ? (
          <View
            role="button"
            aria-label={revealed ? t("hidePassword") : t("showPassword")}
            onPress={() => setRevealed((v) => !v)}
            pressStyle={{ opacity: 0.7 }}
            width={44}
            height={44}
            borderRadius={14}
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            {revealed ? <EyeOff size={20} color={neutral.muted} /> : <Eye size={20} color={neutral.muted} />}
          </View>
        ) : null}
        {locked ? <Lock size={18} color={neutral.muted} strokeWidth={2} /> : null}
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
        ) : locked ? (
          <Text fontSize={13} fontWeight="$secondary" lineHeight={19} color="$neutralMuted">
            {note}
          </Text>
        ) : (
          <Text fontSize={12.5} fontWeight="$secondary" color={error ? "$trashText" : large ? "$neutralPlaceholder" : "$neutralMuted"}>
            {note}
          </Text>
        )
      ) : null}
    </YStack>
  );
}
