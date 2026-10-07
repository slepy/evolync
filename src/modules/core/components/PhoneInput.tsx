import React, { useState, useId } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { ScrollView } from "react-native";
import { ChevronDown, Check } from "lucide-react-native";
import { Input, Sheet, Text, XStack, YStack, useTheme } from "tamagui";
import { BaseCard } from "./BaseCard";

import { PHONE_PREFIXES, type PhoneValue } from "../utils/phonePrefixes";

export { PHONE_PREFIXES, type PhonePrefix, type PhoneValue } from "../utils/phonePrefixes";

// ============================================================================
// Types
// ============================================================================

interface BasePhoneInputProps {
  label?: string;
  error?: string;
  disabled?: boolean;
}

interface FormPhoneInputProps<TFieldValues extends FieldValues>
  extends BasePhoneInputProps {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  value?: never;
  onChange?: never;
}

interface StandalonePhoneInputProps extends BasePhoneInputProps {
  control?: never;
  name?: string;
  value: PhoneValue;
  onChange: (value: PhoneValue) => void;
}

type PhoneInputProps<TFieldValues extends FieldValues = FieldValues> =
  | FormPhoneInputProps<TFieldValues>
  | StandalonePhoneInputProps;

// ============================================================================
// PhoneInput Component
// ============================================================================

// ============================================================================
// Inner component - owns sheet state so it doesn't re-mount on Controller updates
// ============================================================================

interface PhoneInputInnerProps {
  inputId: string;
  value: PhoneValue;
  onChange: (val: PhoneValue) => void;
  error?: string;
  disabled: boolean;
}

const PhoneInputInner = ({ inputId, value, onChange, error, disabled }: PhoneInputInnerProps) => {
  const theme = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedPrefix =
    PHONE_PREFIXES.find((p) => p.code === value.prefix) ?? PHONE_PREFIXES[0];

  const handleNumberChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "");
    onChange({ ...value, number: digits });
  };

  const handlePrefixSelect = (code: string) => {
    onChange({ ...value, prefix: code });
    setSheetOpen(false);
  };

  return (
    <>
      <XStack gap="$2" alignItems="flex-start">
        {/* Prefix selector button */}
        <YStack
          borderWidth={2}
          borderColor={error ? "$imperialRed" : "$borderStrong"}
          borderRadius="$3"
          backgroundColor={disabled ? "$fillStrong" : "$background"}
          paddingHorizontal="$3"
          minWidth={90}
          height="$true"
          justifyContent="center"
          onPress={disabled ? undefined : () => setSheetOpen(true)}
        >
          <XStack alignItems="center" gap="$1">
            <Text fontSize="$4" color="$textPrimary" fontWeight="500">
              {selectedPrefix.code}
            </Text>
            {!disabled && <ChevronDown size={14} color={theme.textSecondary?.val} />}
          </XStack>
        </YStack>

        {/* Number input */}
        <Input
          id={inputId}
          flex={1}
          placeholder={t("phoneNumberPlaceholder")}
          value={value.number}
          onChangeText={handleNumberChange}
          keyboardType="number-pad"
          disabled={disabled}
          autoCapitalize="none"
          borderColor={error ? "$imperialRed" : "$borderStrong"}
          borderWidth={2}
          focusStyle={{
            borderColor: error ? "$imperialRed" : "$chineseGold",
            backgroundColor: "$surface",
          }}
          backgroundColor={disabled ? "$fillStrong" : "$background"}
          color="$textPrimary"
          placeholderTextColor="$textMuted"
        />
      </XStack>

      {/* Prefix picker sheet - outside Controller render to avoid re-mounting on keystroke */}
      <Sheet
        modal
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        snapPoints={[60]}
        dismissOnSnapToBottom
        zIndex={200}
      >
        <Sheet.Overlay
          backgroundColor="rgba(0, 0, 0, 0.5)"
          opacity={0.5}
          zIndex={199}
        />
        <Sheet.Frame
          padding="$4"
          backgroundColor="$background"
          borderTopLeftRadius="$6"
          borderTopRightRadius="$6"
          zIndex={200}
        >
          <Sheet.Handle />
          <Text fontSize="$5" fontWeight="700" color="$textPrimary" marginBottom="$3">
            {t("phonePrefix")}
          </Text>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <YStack gap="$1">
              {PHONE_PREFIXES.map((prefix) => {
                const isSelected = prefix.code === value.prefix;
                return (
                  <BaseCard
                    key={prefix.code}
                    onPress={() => handlePrefixSelect(prefix.code)}
                    backgroundColor={isSelected ? "$blue3" : "$surfaceTranslucent"}
                    borderColor={isSelected ? "$blue11" : "$borderColor"}
                    marginHorizontal={0}
                  >
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text
                        fontSize="$4"
                        fontWeight={isSelected ? "700" : "500"}
                        color="$textPrimary"
                      >
                        {prefix.label}
                      </Text>
                      {isSelected && <Check size={18} color="#3b82f6" />}
                    </XStack>
                  </BaseCard>
                );
              })}
            </YStack>
          </ScrollView>
        </Sheet.Frame>
      </Sheet>
    </>
  );
};

// ============================================================================
// PhoneInput Component
// ============================================================================

export const PhoneInput = <TFieldValues extends FieldValues>({
  control,
  name,
  label,
  error,
  disabled = false,
  value: standaloneValue,
  onChange: standaloneOnChange,
}: PhoneInputProps<TFieldValues>) => {
  const autoId = useId();
  const inputId = name ?? autoId;

  return (
    <YStack gap="$2">
      {label && (
        <Text fontSize="$3" color="$textSecondary" fontWeight="500">
          {label}
        </Text>
      )}

      {control && name ? (
        <Controller
          control={control}
          name={name}
          render={({ field: { onChange, value } }) => (
            <PhoneInputInner
              inputId={inputId}
              value={(value as PhoneValue) ?? { prefix: "+48", number: "" }}
              onChange={onChange}
              error={error}
              disabled={disabled}
            />
          )}
        />
      ) : (
        <PhoneInputInner
          inputId={inputId}
          value={standaloneValue ?? { prefix: "+48", number: "" }}
          onChange={standaloneOnChange ?? (() => {})}
          error={error}
          disabled={disabled}
        />
      )}

      {error && (
        <Text color="$imperialRed" fontSize="$3" fontWeight="500">
          {error}
        </Text>
      )}
    </YStack>
  );
};
