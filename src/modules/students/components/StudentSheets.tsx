import { FormSheet, ListCard, ListCheck, ListIcon, ListRow } from "@/core/components";
import { danger } from "@/core/theme/tokens";
import type GradingRank from "@/database/models/GradingRank";
import { RankIcon } from "@/modules/grading/components";
import { Archive, Pencil } from "lucide-react-native";
import React from "react";
import { ScrollView } from "react-native";
import { View } from "tamagui";

interface StudentRankSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ranks: GradingRank[];
  /** Chosen rank; null = No rank. */
  value: string | null;
  onSelect: (rankId: string | null) => void;
}

/** Rank select sheet (16F): No rank first, then the ranks with their belt icon; a tap picks and closes. */
export const StudentRankSheet: React.FC<StudentRankSheetProps> = ({ open, onOpenChange, ranks, value, onSelect }) => {
  const options = [{ id: null, name: t("gradingNoRank"), color: undefined }, ...ranks.map((r) => ({ id: r.id, name: r.name, color: r.color }))];

  return (
    <FormSheet open={open} onOpenChange={onOpenChange} title={t("fieldRank")} fill={options.length > 6}>
      <ScrollView style={options.length > 6 ? { flex: 1 } : undefined}>
        <ListCard role="radiogroup" aria-label={t("fieldRank")}>
          {options.map((option) => {
            const selected = option.id === value;
            return (
              <ListRow
                key={option.id ?? "none"}
                size="md"
                role="option"
                title={option.name}
                leading={<RankIcon color={option.color} size={40} empty={!option.id} />}
                trailing={selected ? <ListCheck accent="students" /> : undefined}
                selected={selected}
                accent="students"
                onPress={() => {
                  onSelect(option.id);
                  onOpenChange(false);
                }}
              />
            );
          })}
        </ListCard>
      </ScrollView>
    </FormSheet>
  );
};

interface StudentActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  /** Edit only for a student without an app account. */
  onEdit?: () => void;
  onArchive: () => void;
}

/** More actions (16G): Edit (no account only) and Archive in red. */
export const StudentActionsSheet: React.FC<StudentActionsSheetProps> = ({ open, onOpenChange, name, onEdit, onArchive }) => (
  <FormSheet open={open} onOpenChange={onOpenChange} title={name}>
    <ListCard>
      {onEdit ? (
        <ListRow
          size="md"
          title={t("edit")}
          subtitle={t("studentEditHint")}
          leading={<ListIcon icon={Pencil} accent="students" size={44} />}
          onPress={() => {
            onOpenChange(false);
            onEdit();
          }}
        />
      ) : null}
      <ListRow
        size="md"
        danger
        title={t("studentArchiveAction")}
        subtitle={t("studentArchiveHint")}
        leading={
          <View
            width={44}
            height={44}
            borderRadius={14}
            borderWidth={1}
            borderColor="$trashBorder"
            backgroundColor="$trashFill"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Archive size={20} color={danger.text} strokeWidth={2} />
          </View>
        }
        onPress={() => {
          onOpenChange(false);
          onArchive();
        }}
      />
    </ListCard>
  </FormSheet>
);
