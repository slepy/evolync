import {
  ListCard,
  ListEmpty,
  ListRow,
  ListSection,
  LoadingScreen,
  MemberAvatar,
  SearchField,
  StatusBadge,
  SubScreenPage,
} from "@/core/components";
import React, { useMemo, useState } from "react";
import { YStack } from "tamagui";
import { useArchivedStudents } from "../hooks";
import { archivedStudents } from "../studentList";
import { STUDENT_PILL_COLOR } from "./studentStatusStyle";

interface ArchivedStudentsScreenProps {
  schoolId: string;
  onStudentPress: (studentId: string) => void;
}

/**
 * Archived students (16H), opened from the Archive button in the 16A header:
 * searchable list with a dimmed avatar and the "Archived" badge; a tap opens
 * the student, whose ⋮ sheet offers Restore (16G1).
 */
export const ArchivedStudentsScreen: React.FC<ArchivedStudentsScreenProps> = ({ schoolId, onStudentPress }) => {
  const { students, isLoading } = useArchivedStudents(schoolId);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => archivedStudents(students, query), [students, query]);

  if (isLoading) return <LoadingScreen />;

  return (
    <SubScreenPage title={t("studentsArchivedTitle")} context="school">
      <ListSection
        title={t("studentsArchivedCount", { count: students.length })}
        subtitle={students.length > 0 ? t("studentsArchivedHint") : undefined}
      >
        {students.length === 0 ? (
          <ListEmpty text={t("studentsArchivedEmpty")} />
        ) : (
          <YStack gap={12}>
            <SearchField
              value={query}
              onChangeText={setQuery}
              placeholder={t("studentsSearchPlaceholder")}
              accent="students"
            />
            {rows.length === 0 ? (
              <ListEmpty text={t("ordersNoStudentsFound")} />
            ) : (
              <ListCard>
                {rows.map((student) => {
                  const name = student.displayName || student.email || t("unknownMember");
                  return (
                    <ListRow
                      key={student.id}
                      size="md"
                      title={name}
                      subtitle={student.email ?? student.phoneNumber ?? undefined}
                      leading={<MemberAvatar name={name} uri={student.avatarUrl} rankId={student.currentRankId} dimmed />}
                      trailing={<StatusBadge label={t("statusArchived")} color={STUDENT_PILL_COLOR.muted} />}
                      onPress={() => onStudentPress(student.id)}
                    />
                  );
                })}
              </ListCard>
            )}
          </YStack>
        )}
      </ListSection>
    </SubScreenPage>
  );
};
