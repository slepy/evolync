import {
  FormSheet,
  ListAvatar,
  ListCard,
  ListCheck,
  ListRow,
  SearchField,
  matchesSearch,
  memberInitials,
} from "@/core/components";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { Text } from "tamagui";

export interface StudentOption {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

interface StudentSelectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentOption[];
  value?: string;
  onSelect: (studentId: string) => void;
}

/** Above this many students the sheet shows the search (select sheet rule). */
const SEARCH_FROM = 8;

/** Student select sheet (12E1): search, rows with photo or initials and email; tap to choose and close. */
export const StudentSelectSheet: React.FC<StudentSelectSheetProps> = ({ open, onOpenChange, students, value, onSelect }) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const visible = useMemo(
    () => students.filter((s) => matchesSearch(query, s.name, s.email)),
    [students, query],
  );

  return (
    <FormSheet open={open} onOpenChange={onOpenChange} title={t("ordersStudent")}>
      {students.length > SEARCH_FROM ? (
        <SearchField value={query} onChangeText={setQuery} placeholder={t("ordersSearchStudents")} accent="orders" />
      ) : null}
      {visible.length === 0 ? (
        <Text fontSize={13} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
          {students.length === 0 ? t("emptyNoMembersAvailable") : t("ordersNoStudentsFound")}
        </Text>
      ) : (
        <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
          <ListCard role="group" aria-label={t("ordersStudent")}>
            {visible.map((student) => {
              const selected = student.id === value;
              return (
                <ListRow
                  key={student.id}
                  size="md"
                  role="option"
                  title={student.name}
                  subtitle={student.email}
                  leading={<ListAvatar initials={memberInitials(student.name)} uri={student.avatarUrl} />}
                  selected={selected}
                  accent="orders"
                  trailing={selected ? <ListCheck accent="orders" /> : undefined}
                  onPress={() => {
                    onSelect(student.id);
                    onOpenChange(false);
                  }}
                />
              );
            })}
          </ListCard>
        </ScrollView>
      )}
    </FormSheet>
  );
};
