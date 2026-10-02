import SchoolMember from "@/database/models/SchoolMember";
import {
  type AttendanceStatus,
  DEFAULT_ATTENDANCE_STATUS,
  AttendanceStatus as AttendanceStatusEnum,
} from "@/database/models/AttendanceRecord";
import {
  AttendanceListItem,
  AttendanceStats,
  createSessionWithAttendance,
} from "@/modules/attendance";
import type { AttendanceWithMember } from "@/modules/attendance/hooks/useAttendance";
import {
  Header,
  HeaderTitle,
  SubmitComponent,
} from "@/modules/core/components";
import { LoadingScreen } from "@/modules/core/components/LoadingScreen";
import { StudentRepository } from "@/modules/students/repositories";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Users } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack, useTheme } from "tamagui";

/**
 * Screen for creating a new training session with attendance
 *
 * Route: /school/[schoolId]/attendance/create
 *
 * Features:
 * - Creates session for today
 * - Shows all school members with attendance status
 * - Toggle attendance by tapping on member
 * - Save button creates session + attendance records together
 * - Offline support
 */
export default function CreateAttendanceScreen() {
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const sessionDate = useMemo(() => new Date(), []);

  const [attendanceList, setAttendanceList] = useState<AttendanceWithMember[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load school members via repository
  useEffect(() => {
    if (!schoolId) {
      setAttendanceList([]);
      setIsLoading(false);
      return;
    }

    const subscription = StudentRepository.observeActiveBySchoolId(
      schoolId,
    ).subscribe({
      next: (members: SchoolMember[]) => {
        const list: AttendanceWithMember[] = members.map((member) => ({
          record: null,
          member,
          status: DEFAULT_ATTENDANCE_STATUS,
          disabled: false,
        }));

        // Sort by display name
        list.sort((a, b) =>
          (a.member.displayName || "").localeCompare(
            b.member.displayName || "",
          ),
        );

        setAttendanceList(list);
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[CreateAttendanceScreen] Members observer error:", err);
        setError(t("attendanceErrorLoadingAttendance"));
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [schoolId]);

  const handleToggleStatus = (
    memberId: string,
    newStatus: AttendanceStatus,
  ) => {
    setAttendanceList((prev) =>
      prev.map((item) =>
        item.member.id === memberId ? { ...item, status: newStatus } : item,
      ),
    );
  };

  const handleSave = async () => {
    if (!schoolId || attendanceList.length === 0) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Use service to create session with attendance in a single batch
      await createSessionWithAttendance(
        schoolId,
        sessionDate,
        attendanceList.map((item) => ({
          memberId: item.member.id,
          status: item.status,
        })),
      );

      // Navigate back to sessions list
      router.back();
    } catch (err) {
      console.error("[CreateAttendanceScreen] Save error:", err);
      const message = err instanceof Error ? err.message : t("errorSaveFailed");
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Format date for header
  const formatHeaderDate = (date: Date): string => {
    return new Intl.DateTimeFormat("pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  // Get attendance statistics
  const stats = {
    total: attendanceList.length,
    present: attendanceList.filter(
      (a) => a.status === AttendanceStatusEnum.PRESENT,
    ).length,
    absent: attendanceList.filter(
      (a) => a.status === AttendanceStatusEnum.ABSENT,
    ).length,
    excused: attendanceList.filter(
      (a) => a.status === AttendanceStatusEnum.EXCUSED,
    ).length,
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={formatHeaderDate(sessionDate)} />}
      />

      <YStack
        flex={1}
        maxWidth={500}
        width="100%"
        alignSelf="center"
        paddingHorizontal="$4"
      >
        {error && (
          <YStack
            backgroundColor="$red3"
            padding="$3"
            borderRadius="$3"
            marginVertical="$2"
          >
            <Text color="$red10">{error}</Text>
          </YStack>
        )}

        {/* Attendance Statistics */}
        <AttendanceStats
          total={stats.total}
          present={stats.present}
          absent={stats.absent}
          excused={stats.excused}
        />

        {/* Members List */}
        <FlatList
          data={attendanceList}
          keyExtractor={(item) => item.member.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          style={{ flex: 1 }}
          renderItem={({ item }) => (
            <AttendanceListItem item={item} onToggle={handleToggleStatus} />
          )}
          ListEmptyComponent={
            <YStack gap="$2" alignItems="center" marginTop="$10">
              <Users size={48} color={theme.textSecondary?.val} />
              <Text color="$textBody" textAlign="center">
                {t("emptyNoMembers")}
              </Text>
              <Text color="$textMuted" textAlign="center" fontSize="$3">
                {t("emptyNoMembersHint")}
              </Text>
            </YStack>
          }
        />

        {/* Save Button - always visible */}
        <SubmitComponent
          onPress={handleSave}
          isLoading={isSaving}
          disabled={isSaving}
          title={t("attendanceSave")}
        />
      </YStack>
    </View>
  );
}
