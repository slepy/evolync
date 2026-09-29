import { AttendanceStatus } from "@/database/models/AttendanceRecord";
import SchoolMember from "@/database/models/SchoolMember";
import { sync } from "@/database/sync";
import { StudentRepository } from "@/modules/students/repositories";
import {
  Header,
  HeaderTitle,
  OptionsSheet,
  PickerSheet,
  SubmitComponent,
} from "@/modules/core/components";
import type { PickerSheetOption, OptionItem } from "@/modules/core/components";
import { LoadingScreen } from "@/modules/core/components/LoadingScreen";
import {
  StudentInfoCard,
  StudentPaymentRow,
  StudentAttendanceHistoryItem,
} from "@/modules/students/components";
import { getDisplayStatus, MemberStatus } from "@/modules/students/types";
import { PaymentCycleStats } from "@/modules/payments";
import { useStudentPayments } from "@/modules/payments/hooks";
import { useStudentAttendance } from "@/modules/attendance/hooks";
import { STATUS_CONFIG as ATTENDANCE_STATUS_CONFIG } from "@/modules/attendance/constants";
import { OrderCardUser, useMemberOrders } from "@/modules/orders";
import { useGradingRanks } from "@/modules/grading/hooks/useGradingRanks";
import { findRankById } from "@/modules/grading/services/gradingService";
import { assignRankToStudent } from "@/modules/students/services";
import { SchoolRepository } from "@/modules/school/repositories";
import {
  useStudentEvents,
  useStudentEventStatuses,
} from "@/modules/events/hooks";
import { StudentEventCard } from "@/modules/students/components";
import { archiveStudent } from "@/modules/students/services";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CreditCard,
  Calendar,
  ShoppingBag,
  CalendarDays,
  MoreVertical,
  Archive,
  Pencil,
  type LucideIcon,
} from "lucide-react-native";
import React, { useEffect, useMemo, useReducer, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Tabs, Text, XStack, YStack, useTheme } from "tamagui";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";

// ============================================================================
// Constants
// ============================================================================

const MAX_VISIBLE_ITEMS = 10;

const TAB_DEFINITIONS: {
  value: string;
  labelKey: string;
  Icon: LucideIcon;
  colorKey: string;
}[] = [
  {
    value: "payments",
    labelKey: "paymentsTitle",
    Icon: CreditCard,
    colorKey: "jadeGreen",
  },
  {
    value: "attendance",
    labelKey: "attendanceTitle",
    Icon: Calendar,
    colorKey: "darkBlue",
  },
  {
    value: "orders",
    labelKey: "ordersTitle",
    Icon: ShoppingBag,
    colorKey: "orange10",
  },
  {
    value: "events",
    labelKey: "eventsTitle",
    Icon: CalendarDays,
    colorKey: "chineseGold",
  },
];

// ============================================================================
// Tab Trigger Component
// ============================================================================

interface TabTriggerProps {
  value: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
}

function TabTrigger({ value, label, icon, isActive }: TabTriggerProps) {
  return (
    <Tabs.Tab unstyled value={value} flex={1}>
      <YStack
        flex={1}
        width="100%"
        alignItems="center"
        justifyContent="center"
        gap="$1"
        paddingVertical="$2"
        backgroundColor={isActive ? "$softGrayLight" : "$transparent"}
      >
        {icon}
        <Text fontSize="$1" color="$inkBlackLight">
          {label}
        </Text>
      </YStack>
    </Tabs.Tab>
  );
}

// ============================================================================
// Attendance Stats Component
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
  const resolveColor = (color: string): string =>
    color.startsWith("$") ? (theme[color.slice(1)]?.val as string) : color;

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
        <Text fontSize={10} color="$softGrayDark">
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
        <Text fontSize={10} color="$softGrayDark">
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
        <Text fontSize={10} color="$softGrayDark">
          {t(excusedConfig.label)}
        </Text>
      </YStack>
    </XStack>
  );
}

// ============================================================================
// Student Details Screen
// ============================================================================

export default function StudentDetailsScreen() {
  useRequireOrganizationOwner();
  const router = useRouter();
  const theme = useTheme();
  const { schoolId, studentId } = useLocalSearchParams<{
    schoolId: string;
    studentId: string;
  }>();
  const insets = useSafeAreaInsets();

  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const [student, setStudent] = useState<SchoolMember | null>(null);
  const [activeTab, setActiveTab] = useState("payments");
  const [rankPickerOpen, setRankPickerOpen] = useState(false);
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState<string>("");
  const [pendingRankId, setPendingRankId] = useState<string | null | undefined>(
    undefined,
  );

  // Load organization ID from school
  useEffect(() => {
    if (!schoolId) return;
    SchoolRepository.findById(schoolId).then((school) => {
      if (school) setOrganizationId(school.organizationId);
    });
  }, [schoolId]);

  // Load grading ranks for the organization
  const { ranks } = useGradingRanks(organizationId);

  // Load student data with reactive subscription
  useEffect(() => {
    if (!studentId) return;

    const subscription = StudentRepository.observeById(studentId).subscribe({
      next: (foundStudent: SchoolMember) => {
        setStudent(foundStudent);
        forceUpdate();
      },
      error: (error: Error) => {
        console.error("Error observing student:", error);
      },
    });

    return () => subscription.unsubscribe();
  }, [studentId]);

  // Hooks for payments and attendance
  const {
    payments,
    stats: paymentStats,
    updateLocal,
    saveAll: savePayments,
    isSaving: isPaymentSaving,
    hasChanges: hasPaymentChanges,
  } = useStudentPayments(studentId);
  const {
    attendance,
    stats: attendanceStats,
    updateAttendanceStatusLocal,
    saveAll: saveAttendance,
    isSaving: isAttendanceSaving,
    hasChanges: hasAttendanceChanges,
  } = useStudentAttendance(studentId);

  // Orders hook
  const { orders, isLoading: isOrdersLoading } = useMemberOrders(studentId);

  // Events hook
  const { events: studentEvents, isLoading: isEventsLoading } =
    useStudentEvents(studentId);

  // Event statuses management (local editing with save)
  const {
    localEvents,
    toggleStatus: toggleEventStatus,
    saveAll: saveEventStatuses,
    hasChanges: hasEventChanges,
    isSaving: isEventSaving,
  } = useStudentEventStatuses(studentEvents, { isInstructor: true });

  // Rank assignment handler (local state only, saved with save button)
  const hasRankChanges = pendingRankId !== undefined;
  const handleAssignRank = (rankId: string | null) => {
    if (!student) return;
    if (rankId === (student.currentRankId || null)) {
      setPendingRankId(undefined);
    } else {
      setPendingRankId(rankId);
    }
  };

  // Combined state for save button
  const hasAnyChanges =
    hasPaymentChanges ||
    hasAttendanceChanges ||
    hasRankChanges ||
    hasEventChanges;
  const isSaving = isPaymentSaving || isAttendanceSaving || isEventSaving;

  // Handle save all changes
  const handleSaveAll = async () => {
    try {
      const promises: Promise<void>[] = [];
      if (hasPaymentChanges) {
        promises.push(savePayments());
      }
      if (hasAttendanceChanges) {
        promises.push(saveAttendance());
      }
      if (hasEventChanges) {
        promises.push(saveEventStatuses());
      }
      if (hasRankChanges && student) {
        promises.push(
          assignRankToStudent(student.id, pendingRankId!).then(() => {
            setPendingRankId(undefined);
          }),
        );
      }
      await Promise.all(promises);
      sync().catch((err) => {
        console.error("[StudentDetails] Sync error:", err);
      });
    } catch (err) {
      console.error("[StudentDetails] Save error:", err);
    }
  };

  // Handle archive
  const handleArchive = () => {
    Alert.alert(t("studentArchiveTitle"), t("studentArchiveMessage"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("studentArchiveConfirm"),
        style: "destructive",
        onPress: async () => {
          if (!studentId) return;
          try {
            await archiveStudent(studentId);
            router.back();
          } catch (err) {
            console.error("[StudentDetails] Archive error:", err);
          }
        },
      },
    ]);
  };

  // Map ranks to PickerSheet options
  const rankPickerOptions: PickerSheetOption[] = useMemo(
    () => ranks.map((r) => ({ id: r.id, label: r.name, color: r.color })),
    [ranks],
  );

  if (!student) {
    return <LoadingScreen />;
  }

  const displayName = student.displayName || t("emptyNoName");
  const displayStatus = getDisplayStatus(student.status, student.userId);
  const isOfflineStudent = displayStatus === MemberStatus.OFFLINE;
  const effectiveRankId =
    pendingRankId !== undefined ? pendingRankId : student.currentRankId;
  const currentRank = findRankById(ranks, effectiveRankId);

  // Limit displayed items
  const visiblePayments = payments.slice(0, MAX_VISIBLE_ITEMS);
  const visibleAttendance = attendance.slice(0, MAX_VISIBLE_ITEMS);

  // Actions sheet options — edit only for OFFLINE (unregistered) students
  const actionOptions: OptionItem[] = [
    ...(isOfflineStudent
      ? [
          {
            id: "edit",
            label: t("studentEditTitle"),
            icon: Pencil,
            iconColor: "$blue11",
            iconBackground: "$blue2",
            onPress: () =>
              router.push(`/school/${schoolId}/students/${studentId}/edit`),
          } as OptionItem,
        ]
      : []),
    {
      id: "archive",
      label: t("studentArchiveAction"),
      icon: Archive,
      iconColor: "$imperialRedDark",
      iconBackground: "$imperialRedLighter",
      onPress: handleArchive,
    },
  ];

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={displayName} />}
        rightContent={
          <Button
            unstyled
            onPress={() => setActionsSheetOpen(true)}
            paddingHorizontal="$2"
          >
            <MoreVertical
              size={22}
              color={theme.inkBlackLight?.val}
              pointerEvents="none"
            />
          </Button>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: hasAnyChanges ? 100 : 0 }}
      >
        <YStack
          flex={1}
          maxWidth={500}
          width="100%"
          alignSelf="center"
          paddingTop="$3"
        >
          {/* Basic Info Card */}
          <StudentInfoCard
            email={student.email}
            phone={student.phoneNumber}
            avatarUrl={student.avatarUrl}
            status={displayStatus}
            joinedAt={student.joinedAt}
            rankName={currentRank?.name}
            rankColor={currentRank?.color}
            onRankPress={
              ranks.length > 0 ? () => setRankPickerOpen(true) : undefined
            }
          />

          {/* Tabs for History */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            orientation="horizontal"
            flexDirection="column"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
            overflow="hidden"
            marginVertical="$3"
            marginHorizontal="$3"
          >
            {/* Tab List */}
            <Tabs.List
              backgroundColor="rgba(255, 255, 255, 0.7)"
              borderBottomWidth={1}
              borderBottomColor="$borderColor"
            >
              {TAB_DEFINITIONS.map(({ value, labelKey, Icon, colorKey }) => (
                <TabTrigger
                  key={value}
                  value={value}
                  label={t(labelKey)}
                  icon={
                    <Icon
                      size={18}
                      color={theme[colorKey]?.val}
                      pointerEvents="none"
                    />
                  }
                  isActive={activeTab === value}
                />
              ))}
            </Tabs.List>

            {/* Payments Tab Content */}
            <Tabs.Content value="payments" paddingBottom="$3">
              {paymentStats.total > 0 && (
                <PaymentCycleStats
                  paid={paymentStats.paid}
                  pending={paymentStats.pending}
                  cancelled={paymentStats.cancelled}
                  paidByCurrency={paymentStats.paidByCurrency}
                  pendingByCurrency={paymentStats.pendingByCurrency}
                  cancelledByCurrency={paymentStats.cancelledByCurrency}
                />
              )}

              {payments.length === 0 ? (
                <Text
                  color="$softGrayDark"
                  fontSize="$3"
                  textAlign="center"
                  paddingVertical="$6"
                >
                  {t("emptyNoPayments")}
                </Text>
              ) : (
                <YStack gap="$2">
                  {visiblePayments.map((item) => (
                    <StudentPaymentRow
                      key={item.recordId}
                      periodStart={item.cycle.periodStart}
                      periodEnd={item.cycle.periodEnd}
                      amount={item.amount}
                      currency={item.currency}
                      status={item.status}
                      method={item.method}
                      onLocalChange={(data) => updateLocal(item.recordId, data)}
                    />
                  ))}
                  {payments.length > MAX_VISIBLE_ITEMS && (
                    <Text
                      color="$purple10"
                      fontSize="$3"
                      textAlign="center"
                      marginTop="$2"
                    >
                      {t("studentDetailsSeeAll", { count: payments.length })}
                    </Text>
                  )}
                </YStack>
              )}
            </Tabs.Content>

            {/* Attendance Tab Content */}
            <Tabs.Content value="attendance" padding="$3">
              {attendanceStats.total > 0 && (
                <AttendanceStats
                  present={attendanceStats.present}
                  absent={attendanceStats.absent}
                  excused={attendanceStats.excused}
                />
              )}

              {attendance.length === 0 ? (
                <Text
                  color="$softGrayDark"
                  fontSize="$3"
                  textAlign="center"
                  paddingVertical="$6"
                >
                  {t("emptyNoAttendance")}
                </Text>
              ) : (
                <YStack gap="$2">
                  {visibleAttendance.map((item) => (
                    <StudentAttendanceHistoryItem
                      key={item.record.id}
                      recordId={item.record.id}
                      date={item.session.sessionDate}
                      status={item.localStatus}
                      onToggle={updateAttendanceStatusLocal}
                    />
                  ))}
                  {attendance.length > MAX_VISIBLE_ITEMS && (
                    <Text
                      color="$purple10"
                      fontSize="$3"
                      textAlign="center"
                      marginTop="$2"
                    >
                      {t("studentDetailsSeeAll", { count: attendance.length })}
                    </Text>
                  )}
                </YStack>
              )}
            </Tabs.Content>

            {/* Orders Tab Content */}
            <Tabs.Content
              value="orders"
              paddingHorizontal="$1"
              paddingVertical="$3"
            >
              {isOrdersLoading ? (
                <YStack paddingVertical="$6" alignItems="center">
                  <Text color="$softGrayDark" fontSize="$3">
                    {t("loading")}
                  </Text>
                </YStack>
              ) : orders.length === 0 ? (
                <Text
                  color="$softGrayDark"
                  fontSize="$3"
                  textAlign="center"
                  paddingVertical="$6"
                >
                  {t("emptyNoOrders")}
                </Text>
              ) : (
                <YStack gap="$2">
                  {orders.map((item) => (
                    <OrderCardUser
                      key={item.order.id}
                      displayName={
                        item.itemCount === 1
                          ? (item.productName ?? "")
                          : `${item.itemCount} ${t("items")}`
                      }
                      status={item.order.status}
                      totalsByCurrency={item.totalsByCurrency}
                      createdAt={item.order.createdAt}
                      onPress={() =>
                        router.push(
                          `/school/${schoolId}/orders/${item.order.id}`,
                        )
                      }
                    />
                  ))}
                  {orders.length > MAX_VISIBLE_ITEMS && (
                    <Text
                      color="$purple10"
                      fontSize="$3"
                      textAlign="center"
                      marginTop="$2"
                    >
                      {t("studentDetailsSeeAll", { count: orders.length })}
                    </Text>
                  )}
                </YStack>
              )}
            </Tabs.Content>

            {/* Events Tab Content */}
            <Tabs.Content
              value="events"
              paddingHorizontal="$1"
              paddingVertical="$3"
            >
              {isEventsLoading ? (
                <YStack paddingVertical="$6" alignItems="center">
                  <Text color="$softGrayDark" fontSize="$3">
                    {t("loading")}
                  </Text>
                </YStack>
              ) : localEvents.length === 0 ? (
                <Text
                  color="$softGrayDark"
                  fontSize="$3"
                  textAlign="center"
                  paddingVertical="$6"
                >
                  {t("emptyNoEvents")}
                </Text>
              ) : (
                <YStack gap="$2">
                  {localEvents.slice(0, MAX_VISIBLE_ITEMS).map((item) => (
                    <StudentEventCard
                      key={item.event.id}
                      event={item.event}
                      participantStatus={item.localStatus}
                      onPress={() => toggleEventStatus(item.participantId)}
                    />
                  ))}
                  {localEvents.length > MAX_VISIBLE_ITEMS && (
                    <Text
                      color="$purple10"
                      fontSize="$3"
                      textAlign="center"
                      marginTop="$2"
                    >
                      {t("studentDetailsSeeAll", { count: localEvents.length })}
                    </Text>
                  )}
                </YStack>
              )}
            </Tabs.Content>
          </Tabs>
        </YStack>
      </ScrollView>

      {/* Sticky Save Button */}
      {hasAnyChanges && (
        <SubmitComponent
          onPress={handleSaveAll}
          isLoading={isSaving}
          disabled={isSaving}
        />
      )}

      {/* Rank Picker Sheet */}
      <PickerSheet
        open={rankPickerOpen}
        onOpenChange={setRankPickerOpen}
        options={rankPickerOptions}
        selectedId={effectiveRankId || null}
        onSelect={handleAssignRank}
        allowNone
        noneLabel={t("gradingNoRank")}
      />

      {/* Actions Sheet */}
      <OptionsSheet
        open={actionsSheetOpen}
        onOpenChange={setActionsSheetOpen}
        options={actionOptions}
        snapPoint={isOfflineStudent ? 30 : 20}
        zIndex={200}
      />
    </View>
  );
}
