import { FormSheet, ListCard, ListChip, ListEmpty, ListIcon, ListRow, SearchField } from "@/core/components";
import { Flag, WandSparkles } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { Text } from "tamagui";
import { bodyPartLabelKey, filterTechniques, formatThreeDDate, type TechniqueListItem } from "../library";

export interface TechniquePickerSheetProps<T extends TechniqueListItem> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "techniques": saved techniques (D12); "positions": starting positions. */
  kind: "techniques" | "positions";
  items: T[];
  /** Body part of the selected joint: its chip after the title ("Right arm"). */
  bodyPart?: string | null;
  onSelect: (item: T) => void;
}

const label = (bodyPart: string) => t(bodyPartLabelKey(bodyPart));

/**
 * Techniques / Positions over the editor (D12): title with the body-part
 * chip, search, one row per saved pose; a tap applies it to the current step.
 */
export function TechniquePickerSheet<T extends TechniqueListItem>({
  open,
  onOpenChange,
  kind,
  items,
  bodyPart,
  onSelect,
}: TechniquePickerSheetProps<T>) {
  const [query, setQuery] = useState("");
  const positions = kind === "positions";
  const visible = useMemo(() => filterTechniques(items, query, "all", label), [items, query]);

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t(positions ? "threedPositions" : "threedTechniques")}
      badge={bodyPart && !positions ? <ListChip label={label(bodyPart)} accent="threed" /> : undefined}
      fill
    >
      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder={t(positions ? "threedSearchPositions" : "threedSearchTechniques")}
        accent="threed"
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 14, paddingBottom: 12 }} keyboardShouldPersistTaps="handled">
        {visible.length > 0 ? (
          <ListCard aria-label={t(positions ? "threedPositions" : "threedTechniques")}>
            {visible.map((item) => (
              <ListRow
                key={item.id}
                title={item.title}
                subtitle={`${label(item.bodyPart)} · ${formatThreeDDate(item.createdAt, t("locale"))}`}
                leading={<ListIcon icon={positions ? Flag : WandSparkles} accent="threed" size={44} />}
                onPress={() => onSelect(item)}
              />
            ))}
          </ListCard>
        ) : (
          <ListEmpty
            text={t(items.length === 0 ? (positions ? "threedNoPositions" : "threedNoTechniques") : "threedNoMatch")}
            hint={items.length === 0 ? t(positions ? "threedPositionsHint" : "threedTechniquesHint") : undefined}
          />
        )}
        <Text fontSize="$secondary" fontWeight="$secondary" color="$neutralMuted" textAlign="center">
          {t(positions ? "threedApplyPositionHint" : "threedApplyTechniqueHint")}
        </Text>
      </ScrollView>
    </FormSheet>
  );
}
