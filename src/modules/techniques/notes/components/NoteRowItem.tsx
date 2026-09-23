import { ArrowRight, Trash2 } from "lucide-react-native";
import { Button, Input, XStack, useTheme } from "tamagui";
import type { AttackDirection } from "../types";

export type LocalRow = {
  id: string;
  person1Text: string;
  person2Text: string;
  direction: AttackDirection;
};

export function NoteRowItem({
  row,
  onDirectionToggle,
  onDeleteRow,
  onChangeText,
}: {
  row: LocalRow;
  onDirectionToggle: (id: string, current: AttackDirection) => void;
  onDeleteRow: (id: string) => void;
  onChangeText: (
    id: string,
    field: "person1Text" | "person2Text",
    value: string,
  ) => void;
}) {
  const theme = useTheme();

  return (
    <XStack
      paddingHorizontal="$3"
      paddingVertical="$2"
      gap="$2"
      alignItems="center"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
    >
      <Input
        flex={1}
        size="$3"
        placeholder={t("notesPerson1")}
        value={row.person1Text}
        onChangeText={(v) => onChangeText(row.id, "person1Text", v)}
        multiline
      />

      <Button
        size="$3"
        chromeless
        onPress={() => onDirectionToggle(row.id, row.direction)}
        paddingHorizontal="$1"
        rotate={row.direction === "left" ? "180deg" : "0deg"}
      >
        <ArrowRight
          size={18}
          color={theme.chineseCyan?.val ?? "#06B6D4"}
          pointerEvents="none"
        />
      </Button>

      <Input
        flex={1}
        size="$3"
        placeholder={t("notesPerson2")}
        value={row.person2Text}
        onChangeText={(v) => onChangeText(row.id, "person2Text", v)}
        multiline
      />

      <Button
        size="$2"
        chromeless
        onPress={() => onDeleteRow(row.id)}
        pressStyle={{ scale: 0.95, backgroundColor: "$imperialRedLighter" }}
      >
        <Trash2
          size={16}
          color={theme.imperialRedDark?.val}
          pointerEvents="none"
        />
      </Button>
    </XStack>
  );
}
