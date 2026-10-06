import { FormSheet, ListCard, ListCheck, ListRow, SearchField, matchesSearch, resolveListAccent, type ListAccent } from "@/core/components";
import { neutral } from "@/core/theme/tokens";
import { PHONE_PREFIXES, type PhoneValue } from "@/modules/core/components";
import { ChevronDown } from "lucide-react-native";
import React, { useState } from "react";
import { Input, ScrollView, Text, XStack, YStack } from "tamagui";

interface PhoneFieldProps {
  label: string;
  value: PhoneValue;
  onChange: (value: PhoneValue) => void;
  accent?: ListAccent;
  error?: string;
  disabled?: boolean;
}

/**
 * Phone with a country prefix (new account board): 96px prefix button that
 * opens a searchable prefix sheet, then the number field.
 */
export const PhoneField: React.FC<PhoneFieldProps> = ({ label, value, onChange, accent = "neutral", error, disabled }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const tint = resolveListAccent(accent).tint;
  const prefixes = PHONE_PREFIXES.filter((p) => matchesSearch(query, p.code, p.label));

  const fieldStyle = {
    height: 52,
    borderRadius: 16,
    backgroundColor: "$neutralPage",
    borderWidth: 1,
    borderColor: "$neutralRaisedBorder",
  } as const;

  return (
    <YStack gap={8}>
      <Text fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted">
        {label}
      </Text>
      <XStack gap={10}>
        <XStack
          role="button"
          aria-haspopup="dialog"
          aria-label={`${t("phonePrefix")}, ${value.prefix}`}
          onPress={disabled ? undefined : () => setOpen(true)}
          pressStyle={{ opacity: 0.85 }}
          {...fieldStyle}
          width={96}
          paddingLeft={16}
          paddingRight={12}
          alignItems="center"
          justifyContent="space-between"
          flexShrink={0}
        >
          <Text fontSize={17} fontWeight="700" color="$neutralText">
            {value.prefix}
          </Text>
          <ChevronDown size={18} color={neutral.muted} />
        </XStack>
        <Input
          aria-label={label}
          value={value.number}
          onChangeText={(number) => onChange({ ...value, number: number.replace(/[^\d]/g, "") })}
          placeholder="600 123 456"
          placeholderTextColor={neutral.placeholder}
          editable={!disabled}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          unstyled
          flex={1}
          minWidth={0}
          paddingHorizontal={16}
          {...fieldStyle}
          borderWidth={focused || error ? 1.5 : 1}
          borderColor={error ? "$alertDot" : focused ? tint : "$neutralRaisedBorder"}
          color="$neutralText"
          fontSize={17}
          fontWeight="700"
        />
      </XStack>
      {error ? (
        <Text fontSize={12.5} fontWeight="600" color="$trashText">
          {error}
        </Text>
      ) : null}

      <FormSheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
        title={t("phonePrefix")}
        fill
      >
        <SearchField value={query} onChangeText={setQuery} placeholder={t("phonePrefixSearch")} accent={accent} />
        <ScrollView flex={1} keyboardShouldPersistTaps="handled">
          <ListCard role="group" aria-label={t("phonePrefix")}>
            {prefixes.map((p) => (
              <ListRow
                key={p.code}
                size="md"
                role="option"
                title={p.label}
                selected={p.code === value.prefix}
                accent={accent}
                trailing={p.code === value.prefix ? <ListCheck accent={accent} /> : undefined}
                onPress={() => {
                  onChange({ ...value, prefix: p.code });
                  setOpen(false);
                  setQuery("");
                }}
              />
            ))}
          </ListCard>
        </ScrollView>
      </FormSheet>
    </YStack>
  );
};
