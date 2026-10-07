import { TrashButton } from "@/core/components";
import { moduleAccents, neutral } from "@/core/theme/tokens";
import { RefreshCw } from "lucide-react-native";
import { useState } from "react";
import { Input, Text, View, XStack, YStack } from "tamagui";
import { bubbleOrder, leaderOf, type EditableRow } from "../noteRows";

type Person = "person1Text" | "person2Text";

export interface NoteRowCardProps {
  row: EditableRow;
  /** 1-based position shown in the circle. */
  number: number;
  onChangeText: (field: Person, value: string) => void;
  onToggleDirection: () => void;
  onDelete: () => void;
}

/**
 * One step of a descriptive note (T4): number, who leads, delete; then the
 * two people as chat bubbles, Person 1 cyan on the left, Person 2 neutral on
 * the right, the leader on top. The swap button between them changes who leads.
 */
export function NoteRowCard({ row, number, onChangeText, onToggleDirection, onDelete }: NoteRowCardProps) {
  const leader = leaderOf(row.direction);
  const [first, second] = bubbleOrder(row.direction);
  const bubble = (person: 1 | 2) => {
    const field: Person = person === 1 ? "person1Text" : "person2Text";
    return (
      <PersonBubble
        person={person}
        leads={person === leader}
        value={row[field]}
        onChangeText={(v) => onChangeText(field, v)}
      />
    );
  };

  return (
    <YStack gap={8}>
      <XStack alignItems="center" gap={10}>
        <View width={28} height={28} borderRadius={14} backgroundColor="$neutralTintFill" alignItems="center" justifyContent="center">
          <Text fontSize={13} fontWeight="$button" color="$neutralTint">
            {number}
          </Text>
        </View>
        <Text flex={1} fontSize={13} fontWeight="700" color="$neutralMuted">
          {t("notesLeads", { person: leader })}
        </Text>
        <TrashButton size={40} label={t("notesDeleteRowNumber", { number })} onPress={onDelete} />
      </XStack>

      {bubble(first)}
      <XStack justifyContent="center" marginVertical={-2}>
        <View
          role="button"
          aria-label={t("notesSwapLeader", { person: second })}
          onPress={onToggleDirection}
          pressStyle={{ opacity: 0.8 }}
          width={44}
          height={44}
          borderRadius={22}
          backgroundColor="$notebookFill"
          alignItems="center"
          justifyContent="center"
        >
          <RefreshCw size={20} color={moduleAccents.notebook.tint} strokeWidth={2.2} />
        </View>
      </XStack>
      {bubble(second)}
    </YStack>
  );
}

interface PersonBubbleProps {
  person: 1 | 2;
  leads: boolean;
  value: string;
  onChangeText: (v: string) => void;
}

/** Person 1 bubble: cyan, on the left, square top-left corner; Person 2: neutral, on the right, square top-right. */
function PersonBubble({ person, leads, value, onChangeText }: PersonBubbleProps) {
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
