import { TrashButton } from "@/core/components";
import { moduleAccents, neutral } from "@/core/theme/tokens";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { useState } from "react";
import { Input, Text, View, XStack, YStack } from "tamagui";
import { leaderOf, type EditableRow } from "../noteRows";

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
 * Person 1 and Person 2 cells with the direction arrow between them
 * (→ Person 1 leads, ← Person 2 leads).
 */
export function NoteRowCard({ row, number, onChangeText, onToggleDirection, onDelete }: NoteRowCardProps) {
  const leader = leaderOf(row.direction);
  const Arrow = leader === 1 ? ArrowRight : ArrowLeft;

  return (
    <YStack
      gap={10}
      paddingTop={12}
      paddingBottom={14}
      paddingLeft={14}
      paddingRight={12}
      borderRadius="$card"
      borderWidth={1}
      borderColor="$neutralCardBorder"
      backgroundColor="$neutralCard"
    >
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

      <XStack alignItems="center" gap={4}>
        <RowCell value={row.person1Text} placeholder={t("notesPerson1")} onChangeText={(v) => onChangeText("person1Text", v)} />
        <View
          role="button"
          aria-label={t("notesChangeDirection", { person: leader })}
          onPress={onToggleDirection}
          pressStyle={{ opacity: 0.8 }}
          width={44}
          height={44}
          borderRadius={22}
          backgroundColor="$notebookFill"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Arrow size={20} color={moduleAccents.notebook.tint} strokeWidth={2.4} />
        </View>
        <RowCell value={row.person2Text} placeholder={t("notesPerson2")} onChangeText={(v) => onChangeText("person2Text", v)} />
      </XStack>
    </YStack>
  );
}

function RowCell({ value, placeholder, onChangeText }: { value: string; placeholder: string; onChangeText: (v: string) => void }) {
  const [focused, setFocused] = useState(false);

  return (
    <Input
      unstyled
      flex={1}
      minWidth={0}
      minHeight={76}
      multiline
      aria-label={placeholder}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={neutral.placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      textAlignVertical="top"
      paddingVertical={10}
      paddingHorizontal={12}
      borderRadius={14}
      borderWidth={focused ? 1.5 : 1}
      borderColor={focused ? "$notebookTint" : "$neutralRaisedBorder"}
      backgroundColor="$neutralPage"
      color="$neutralText"
      fontSize={14}
      fontWeight="600"
      lineHeight={20}
    />
  );
}
