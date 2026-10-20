import { TrashButton } from "@/core/components";
import { moduleAccents } from "@/core/theme/tokens";
import { RefreshCw } from "lucide-react-native";
import { Text, View, XStack, YStack } from "tamagui";
import { bubbleOrder, leaderOf, type EditableRow } from "../noteRows";
import { PersonBubble } from "./PersonBubble";

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
