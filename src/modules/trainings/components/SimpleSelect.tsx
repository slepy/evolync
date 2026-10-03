import { ChevronDown } from "lucide-react-native";
import React from "react";
import { Adapt, Select, Sheet, Text, YStack } from "tamagui";

export interface SimpleSelectOption {
  value: string;
  label: string;
}

interface SimpleSelectProps {
  label?: string;
  value: string | undefined;
  options: SimpleSelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  flex?: number;
}

/** Tamagui Select styled like the event form's selects (sheet on touch). */
export const SimpleSelect: React.FC<SimpleSelectProps> = ({
  label,
  value,
  options,
  placeholder,
  onChange,
  error,
  disabled = false,
  flex,
}) => (
  <YStack gap="$2" flex={flex}>
    {label && (
      <Text fontSize="$3" color="$textSecondary" fontWeight="500">
        {label}
      </Text>
    )}
    <Select value={value ?? ""} onValueChange={onChange} disablePreventBodyScroll>
      <Select.Trigger
        borderColor={error ? "$imperialRed" : "$borderStrong"}
        borderWidth={2}
        backgroundColor={disabled ? "$fillStrong" : "$background"}
        disabled={disabled}
        iconAfter={ChevronDown}
      >
        <Select.Value placeholder={placeholder} />
      </Select.Trigger>

      <Adapt when="sm" platform="touch">
        <Sheet modal dismissOnSnapToBottom snapPointsMode="fit">
          <Sheet.Frame>
            <Sheet.ScrollView>
              <Adapt.Contents />
            </Sheet.ScrollView>
          </Sheet.Frame>
          <Sheet.Overlay />
        </Sheet>
      </Adapt>

      <Select.Content zIndex={200000}>
        <Select.ScrollUpButton />
        <Select.Viewport>
          {options.map((option, index) => (
            <Select.Item key={option.value} value={option.value} index={index}>
              <Select.ItemText>{option.label}</Select.ItemText>
            </Select.Item>
          ))}
        </Select.Viewport>
        <Select.ScrollDownButton />
      </Select.Content>
    </Select>
    {error && (
      <Text color="$imperialRed" fontSize="$3">
        {error}
      </Text>
    )}
  </YStack>
);
