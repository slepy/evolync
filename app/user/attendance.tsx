import { useRouter } from "expo-router";
import { YStack, Text, ScrollView, XStack, useTheme } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "react-native";
import { Header, HeaderTitle } from "@/modules/core/components";
import { useStore } from "@/store";
import { StudentAttendanceHistoryItem } from "@/modules/students/components";
import { useStudentAttendance } from "@/modules/attendance/hooks";
import { AttendanceStatus } from "@/database/models/AttendanceRecord";
import { STATUS_CONFIG as ATTENDANCE_STATUS_CONFIG } from "@/modules/attendance/constants";

// ============================================================================
// Attendance Stats Component (like PaymentCycleStats)
// ============================================================================

interface AttendanceStatsProps {
  present: number;
  absent: number;
  excused: number;
}

function AttendanceStats({ present, absent, excused }: AttendanceStatsProps) {
  const presentConfig = ATTENDANCE_STATUS_CONFIG[AttendanceStatus.PRESENT];
  const absentConfig = ATTENDANCE_STATUS_CONFIG[AttendanceStatus.ABSENT];
  const excusedConfig = ATTENDANCE_STATUS_CONFIG[AttendanceStatus.EXCUSED];

  const PresentIcon = presentConfig.icon;
  const AbsentIcon = absentConfig.icon;
  const ExcusedIcon = excusedConfig.icon;

  const theme = useTheme();
  const resolveColor = (color: string) =>
    color.startsWith("$") ? theme[color.slice(1)]?.val : color;

  return (
    <XStack
      marginVertical="$3"
      justifyContent="center"
      alignItems="center"
      paddingHorizontal="$2"
      gap="$5"
    >
      <YStack alignItems="center">
        <XStack alignItems="center" gap="$1.5">
          <PresentIcon size={18} color={resolveColor(presentConfig.color)} />
          <Text fontSize="$5" fontWeight="700" color={presentConfig.color}>
            {present}
          </Text>
        </XStack>
        <Text fontSize={10} color="$textSecondary">
          {t(presentConfig.label)}
        </Text>
      </YStack>

      <YStack alignItems="center">
        <XStack alignItems="center" gap="$1.5">
          <AbsentIcon size={18} color={resolveColor(absentConfig.color)} />
          <Text fontSize="$5" fontWeight="700" color={absentConfig.color}>
            {absent}
          </Text>
        </XStack>
        <Text fontSize={10} color="$textSecondary">
          {t(absentConfig.label)}
        </Text>
      </YStack>

      <YStack alignItems="center">
        <XStack alignItems="center" gap="$1.5">
          <ExcusedIcon size={18} color={resolveColor(excusedConfig.color)} />
          <Text fontSize="$5" fontWeight="700" color={excusedConfig.color}>
            {excused}
          </Text>
        </XStack>
        <Text fontSize={10} color="$textSecondary">
          {t(excusedConfig.label)}
        </Text>
      </YStack>
    </XStack>
  );
}

// ============================================================================
// User Attendance Screen
// ============================================================================

export default function UserAttendanceScreen() {
  const router = useRouter();
  const schoolMembership = useStore((state) => state.getActiveMembership());
  const insets = useSafeAreaInsets();

  const { attendance, stats } = useStudentAttendance(
    schoolMembership?.memberId,
  );

  if (!schoolMembership) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Header onBack={() => router.back()} centerContent={<HeaderTitle text={t("attendanceTitle")} />} />
        <YStack flex={1} padding="$6" alignItems="center" justifyContent="center">
          <Text fontSize="$5" color="$gray11" textAlign="center">{t("pendingMembershipInfo")}</Text>
        </YStack>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("attendanceTitle")} />}
      />
      <ScrollView>
        <YStack gap="$2" paddingTop="$2">
          {/* Stats Summary */}
          {stats.total > 0 && (
            <AttendanceStats
              present={stats.present}
              absent={stats.absent}
              excused={stats.excused}
            />
          )}

          {attendance.length === 0 ? (
            <YStack
              flex={1}
              padding="$6"
              gap="$4"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="$5" color="$gray11" textAlign="center">
                {t("emptyNoAttendance")}
              </Text>
            </YStack>
          ) : (
            <YStack gap="$2" marginHorizontal="$3">
              {attendance.map((item) => (
                <StudentAttendanceHistoryItem
                  key={item.record.id}
                  recordId={item.record.id}
                  date={item.session.sessionDate}
                  status={item.localStatus}
                  onToggle={() => {}} // No-op - read-only
                  disabled={true} // Read-only mode
                />
              ))}
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </View>
  );
}
