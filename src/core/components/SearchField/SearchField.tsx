import { neutral } from "@/core/theme/tokens";
import { Search, X } from "lucide-react-native";
import { useState } from "react";
import { Input, View, XStack } from "tamagui";
import { resolveListAccent, type ListAccent } from "../List/accent";

export interface SearchFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  /** Placeholder and accessible label ("Search students"). */
  placeholder: string;
  accent?: ListAccent;
  autoFocus?: boolean;
}

/**
 * 48px search above a long list (select sheet with more than 8 options,
 * 12E1): search icon, input, clear button once there is text.
 */
export function SearchField({ value, onChangeText, placeholder, accent = "neutral", autoFocus }: SearchFieldProps) {
  const [focused, setFocused] = useState(false);
  const tint = resolveListAccent(accent).tint;

  return (
    <XStack
      alignItems="center"
      gap={10}
      height={48}
      paddingLeft={14}
      paddingRight={6}
      borderRadius={16}
      backgroundColor="$neutralCard"
      borderWidth={focused ? 1.5 : 1}
      borderColor={focused ? tint : "$neutralRaisedBorder"}
    >
      <Search size={18} color={focused ? tint : neutral.muted} strokeWidth={2.2} />
      <Input
        flex={1}
        unstyled
        aria-label={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={neutral.placeholder}
        autoFocus={autoFocus}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        color="$neutralText"
        fontSize={15}
        fontWeight="600"
        height={46}
      />
      {value ? (
        <View
          role="button"
          aria-label={t("clear")}
          onPress={() => onChangeText("")}
          pressStyle={{ opacity: 0.8 }}
          width={36}
          height={36}
          borderRadius={18}
          alignItems="center"
          justifyContent="center"
          backgroundColor="$neutralTintFill"
        >
          <X size={16} color={neutral.tint} strokeWidth={2.4} />
        </View>
      ) : null}
    </XStack>
  );
}
