import { FormSheet, ListCard, ListCheck, ListRow } from "@/core/components";
import type GradingRank from "@/database/models/GradingRank";
import { RankIcon } from "@/modules/grading/components";
import React from "react";
import { ScrollView } from "react-native";

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
                aria-selected={selected}
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
