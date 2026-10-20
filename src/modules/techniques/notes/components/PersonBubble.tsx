import { neutral } from "@/core/theme/tokens";
import { useState } from "react";
import { Input, Text, YStack } from "tamagui";

export interface PersonBubbleProps {
  person: 1 | 2;
  leads: boolean;
  value: string;
  onChangeText: (v: string) => void;
}

/** Person 1 bubble: cyan, on the left, square top-left corner; Person 2: neutral, on the right, square top-right. */
export function PersonBubble({ person, leads, value, onChangeText }: PersonBubbleProps) {
  const [focused, setFocused] = useState(false);
  const isFirst = person === 1;
  const name = t(isFirst ? "notesPerson1" : "notesPerson2");

  return (
    <YStack
      alignSelf={isFirst ? "flex-start" : "flex-end"}
      width="86%"
      gap={8}
      padding={10}
      borderRadius={20}
      borderTopLeftRadius={isFirst ? 6 : 20}
      borderTopRightRadius={isFirst ? 20 : 6}
      borderWidth={1}
      borderColor={isFirst ? "$noteBubbleBorder" : "$neutralRaisedBorder"}
      backgroundColor={isFirst ? "$noteBubbleFill" : "$neutralCard"}
    >
      <Text
        paddingHorizontal={4}
        fontSize={11}
        fontWeight="$eyebrow"
        letterSpacing={0.8}
        textTransform="uppercase"
        color={isFirst ? "$notebookLabel" : "$neutralMuted"}
      >
        {leads ? t("notesPersonLeads", { person }) : name}
      </Text>
      <Input
        unstyled
        multiline
        scrollEnabled={false}
        minHeight={44}
        aria-label={name}
        value={value}
        onChangeText={onChangeText}
        placeholder={t("notesPersonPlaceholder", { person })}
        placeholderTextColor={neutral.placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        textAlignVertical="top"
        paddingVertical={10}
        paddingHorizontal={12}
        borderRadius={14}
        borderWidth={focused ? 1.5 : 1}
        borderColor={focused ? "$notebookFrom" : "$neutralRaisedBorder"}
        backgroundColor="$neutralPage"
        color="$neutralText"
        fontSize={15}
        fontWeight="600"
        lineHeight={22}
      />
    </YStack>
  );
}
