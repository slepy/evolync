import { neutral } from "@/core/theme/tokens";
import { ChevronDown } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView } from "react-native";
import { Input, Text, XStack, YStack } from "tamagui";
import { FormSheet } from "../FormSheet";
import { ListCard, ListCheck, ListRow } from "../List";
import { resolveListAccent, type ListAccent } from "../List/accent";
import { SearchField, matchesSearch } from "../SearchField";

export interface PhonePrefixOption {
  /** "+48" */
  code: string;
  /** "🇵🇱 +48" */
  label: string;
}

export interface PhoneFieldProps {
  /** Uppercase label ("PHONE (OPTIONAL)"). */
  label: string;
  prefix: string;
  number: string;
  /** Digits only reach the parent. */
  onChange: (value: { prefix: string; number: string }) => void;
  /** Country prefixes offered by the sheet. */
  prefixes: readonly PhonePrefixOption[];
  placeholder?: string;
  accent?: ListAccent;
  error?: string;
  /**
   * "form" (default): 56px on the card fill. "large": 52px on the page fill
   * with 17/700 text, like `TextField` `size="large"` (P1 Profile card).
   */
  size?: "form" | "large";
}

/**
 * Phone field (16C): 96px country prefix button (opens a searchable sheet)
 * next to the number input, both 56px with the form field geometry.
 */
export function PhoneField({ label, prefix, number, onChange, prefixes, placeholder, accent = "neutral", error, size = "form" }: PhoneFieldProps) {
  const [focused, setFocused] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState("");
  const tint = resolveListAccent(accent).tint;
  const options = prefixes.filter((p) => matchesSearch(query, p.code, p.label));
  const large = size === "large";
  const height = large ? 52 : 56;
  const fill = large ? "$neutralPage" : "$neutralCard";
  const fontSize = large ? 17 : 15;

  return (
    <YStack gap={8}>
      <Text fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted">
        {label}
      </Text>
      <XStack gap={10}>
        <XStack
          role="button"
          aria-haspopup="dialog"
          aria-label={`${label}, ${prefix}`}
          onPress={() => setSheetOpen(true)}
          pressStyle={{ opacity: 0.85 }}
          width={96}
          height={height}
          paddingLeft={16}
          paddingRight={12}
          alignItems="center"
          justifyContent="space-between"
          borderRadius={16}
          borderWidth={sheetOpen ? 1.5 : 1}
          borderColor={sheetOpen ? tint : "$neutralRaisedBorder"}
          backgroundColor={fill}
          flexShrink={0}
        >
          <Text fontSize={fontSize} fontWeight={large ? "700" : "$rowTitle"} color="$neutralText">
            {prefix}
          </Text>
          <ChevronDown size={16} color={neutral.muted} strokeWidth={2} />
        </XStack>
        <Input
          flex={1}
          unstyled
          aria-label={label}
          value={number}
          onChangeText={(text) => onChange({ prefix, number: text.replace(/[^0-9]/g, "") })}
          placeholder={placeholder}
          placeholderTextColor={neutral.placeholder}
          keyboardType="phone-pad"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          height={height}
          paddingHorizontal={16}
          borderRadius={16}
          borderWidth={focused || error ? 1.5 : 1}
          borderColor={error ? "$trashText" : focused ? tint : "$neutralRaisedBorder"}
          backgroundColor={fill}
          color="$neutralText"
          fontSize={fontSize}
          fontWeight={large ? "700" : "600"}
        />
      </XStack>
      {error ? (
        <Text fontSize={12.5} fontWeight="$secondary" color="$trashText">
          {error}
        </Text>
      ) : null}

      <FormSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setQuery("");
        }}
        title={label}
        fill
      >
        <SearchField value={query} onChangeText={setQuery} placeholder={t("search")} accent={accent} />
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          <ListCard role="group" aria-label={label}>
            {options.map((option) => (
              <ListRow
                key={option.code}
                size="md"
                role="option"
                title={option.label}
                aria-selected={option.code === prefix}
                accent={accent}
                trailing={option.code === prefix ? <ListCheck accent={accent} /> : undefined}
                onPress={() => {
                  onChange({ prefix: option.code, number });
                  setSheetOpen(false);
                  setQuery("");
                }}
              />
            ))}
          </ListCard>
        </ScrollView>
      </FormSheet>
    </YStack>
  );
}
