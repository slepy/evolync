import React, { useState, useId } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { ScrollView } from "react-native";
import { ChevronDown, Check } from "lucide-react-native";
import { Input, Sheet, Text, XStack, YStack } from "tamagui";
import { BaseCard } from "./BaseCard";

// ============================================================================
// Phone prefix options
// ============================================================================

export interface PhonePrefix {
  code: string;  // e.g. "+48"
  label: string; // e.g. "🇵🇱 +48"
}

export const PHONE_PREFIXES: PhonePrefix[] = [
  { code: "+48", label: "🇵🇱 +48" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+49", label: "🇩🇪 +49" },
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+34", label: "🇪🇸 +34" },
  { code: "+39", label: "🇮🇹 +39" },
  { code: "+31", label: "🇳🇱 +31" },
  { code: "+32", label: "🇧🇪 +32" },
  { code: "+43", label: "🇦🇹 +43" },
  { code: "+41", label: "🇨🇭 +41" },
  { code: "+46", label: "🇸🇪 +46" },
  { code: "+47", label: "🇳🇴 +47" },
  { code: "+45", label: "🇩🇰 +45" },
  { code: "+358", label: "🇫🇮 +358" },
  { code: "+420", label: "🇨🇿 +420" },
  { code: "+421", label: "🇸🇰 +421" },
  { code: "+36", label: "🇭🇺 +36" },
  { code: "+40", label: "🇷🇴 +40" },
  { code: "+380", label: "🇺🇦 +380" },
  { code: "+7", label: "🇷🇺 +7" },
  { code: "+81", label: "🇯🇵 +81" },
  { code: "+82", label: "🇰🇷 +82" },
  { code: "+86", label: "🇨🇳 +86" },
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+55", label: "🇧🇷 +55" },
  { code: "+52", label: "🇲🇽 +52" },
  { code: "+54", label: "🇦🇷 +54" },
  { code: "+61", label: "🇦🇺 +61" },
  { code: "+27", label: "🇿🇦 +27" },
  { code: "+20", label: "🇪🇬 +20" },
  { code: "+966", label: "🇸🇦 +966" },
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+90", label: "🇹🇷 +90" },
  { code: "+30", label: "🇬🇷 +30" },
  { code: "+351", label: "🇵🇹 +351" },
  { code: "+353", label: "🇮🇪 +353" },
];

// ============================================================================
// Types
// ============================================================================

export interface PhoneValue {
  prefix: string;
  number: string;
}

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
          borderColor={error ? "$imperialRed" : "$softGrayLight"}
          borderRadius="$3"
          backgroundColor={disabled ? "$softGrayLight" : "$pearlWhite"}
          paddingHorizontal="$3"
          minWidth={90}
          height="$true"
          justifyContent="center"
          onPress={disabled ? undefined : () => setSheetOpen(true)}
        >
          <XStack alignItems="center" gap="$1">
            <Text fontSize="$4" color="$inkBlack" fontWeight="500">
              {selectedPrefix.code}
            </Text>
            {!disabled && <ChevronDown size={14} color="#888" />}
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
          borderColor={error ? "$imperialRed" : "$softGrayLight"}
          borderWidth={2}
          focusStyle={{
            borderColor: error ? "$imperialRed" : "$chineseGold",
            backgroundColor: "$pearlWhiteLight",
          }}
          backgroundColor={disabled ? "$softGrayLight" : "$pearlWhite"}
          color="$inkBlack"
          placeholderTextColor="$softGray"
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
          <Text fontSize="$5" fontWeight="700" color="$inkBlack" marginBottom="$3">
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
                    backgroundColor={isSelected ? "$blue3" : "rgba(255, 255, 255, 0.7)"}
                    borderColor={isSelected ? "$blue11" : "$borderColor"}
                    marginHorizontal={0}
                  >
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text
                        fontSize="$4"
                        fontWeight={isSelected ? "700" : "500"}
                        color="$inkBlack"
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
        <Text fontSize="$3" color="$softGrayDark" fontWeight="500">
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
