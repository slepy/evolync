import SchoolJoinRequest from "@/database/models/SchoolJoinRequest";
import SchoolMember from "@/database/models/SchoolMember";
import Event from "@/database/models/Event";
import PaymentCycle from "@/database/models/PaymentCycle";
import { StudentRepository } from "../repositories";
import { PaymentCycleRepository } from "@/modules/payments/repositories/paymentCycleRepository";
import { PaymentRecordRepository } from "@/modules/payments/repositories/paymentRecordRepository";
import { EventRepository } from "@/modules/events/repositories/eventRepository";
import { EventParticipantRepository } from "@/modules/events/repositories/eventParticipantRepository";
import { approveJoinRequest } from "../services";
import {
  BaseCard,
  CardInfo,
  SubmitComponent,
  Thumbnail,
} from "@/modules/core/components";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView } from "react-native";
import {
  Button,
  Sheet,
  Separator,
  Text,
  XStack,
  YStack,
  useTheme,
} from "tamagui";
import { Calendar, CalendarDays, Check } from "lucide-react-native";
import { StudentCard } from "./StudentCard";

// ============================================================================
// Types
// ============================================================================

type StudentMode = "new" | "existing";

interface CycleWithMembership {
  cycle: PaymentCycle;
  alreadyMember: boolean;
}

interface EventWithMembership {
  event: Event;
  alreadyParticipant: boolean;
}

interface ApproveJoinRequestSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: SchoolJoinRequest;
  schoolId: string;
  organizationId: string;
  onApproved: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const ApproveJoinRequestSheet: React.FC<
  ApproveJoinRequestSheetProps
> = ({ open, onOpenChange, request, schoolId, organizationId, onApproved }) => {
  const [mode, setMode] = useState<StudentMode>("new");
  const [existingMembers, setExistingMembers] = useState<SchoolMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [activeCycles, setActiveCycles] = useState<CycleWithMembership[]>([]);
  const [selectedCycleIds, setSelectedCycleIds] = useState<Set<string>>(
    new Set(),
  );
  const [upcomingEvents, setUpcomingEvents] = useState<EventWithMembership[]>(
    [],
  );
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Load data when sheet opens ────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    loadData();
  }, [open]);
  const theme = useTheme();
  const loadData = async () => {
    setLoading(true);
    try {
      // Load existing offline members
      const members = await StudentRepository.findBySchoolId(schoolId);
      setExistingMembers(members);

      // Auto-select member with matching email or phone
      const matched = members.find(
        (m) =>
          (request.email && m.email === request.email) ||
          (request.phoneNumber && m.phoneNumber === request.phoneNumber),
      );
      if (matched) {
        setSelectedMemberId(matched.id);
        setMode("existing");
      } else {
        setSelectedMemberId(null);
        setMode("new");
      }

      // Load active payment cycles (period_start <= today <= period_end)
      const today = new Date();
      const allCycles = await PaymentCycleRepository.findBySchoolId(schoolId);
      const active = allCycles.filter((c) => {
        const start = new Date(c.periodStart);
        const end = new Date(c.periodEnd);
        return start <= today && today <= end;
      });

      // For each active cycle, check if matched member is already in it
      const cyclesWithMembership: CycleWithMembership[] = await Promise.all(
        active.map(async (cycle) => {
          let alreadyMember = false;
          if (matched) {
            const record = await PaymentRecordRepository.findByCycleAndMember(
              cycle.id,
              matched.id,
            );
            alreadyMember = record !== null;
          }
          return { cycle, alreadyMember };
        }),
      );
      setActiveCycles(cyclesWithMembership);

      // Default: select cycles where matched member isn't yet added
      const defaultCycleIds = new Set<string>(
        cyclesWithMembership
          .filter((c) => !c.alreadyMember)
          .map((c) => c.cycle.id),
      );
      // Also keep cycles where member is already in (pre-checked)
      cyclesWithMembership
        .filter((c) => c.alreadyMember)
        .forEach((c) => defaultCycleIds.add(c.cycle.id));
      setSelectedCycleIds(defaultCycleIds);

      // Load upcoming events
      const events = await EventRepository.findUpcoming(organizationId);

      const eventsWithMembership: EventWithMembership[] = await Promise.all(
        events.map(async (event) => {
          let alreadyParticipant = false;
          if (matched) {
            const participant =
              await EventParticipantRepository.findByEventAndMember(
                event.id,
                matched.id,
              );
            alreadyParticipant = participant !== null;
          }
          return { event, alreadyParticipant };
        }),
      );
      setUpcomingEvents(eventsWithMembership);

      // Default: select events where member is already a participant
      const defaultEventIds = new Set<string>(
        eventsWithMembership
          .filter((e) => e.alreadyParticipant)
          .map((e) => e.event.id),
      );
      setSelectedEventIds(defaultEventIds);
    } catch (err) {
      console.error("[ApproveJoinRequestSheet] loadData error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── When mode/member changes, refresh payment/event membership state ──────

  const refreshMemberships = useCallback(
    async (memberId: string | null) => {
      const updated = await Promise.all(
        activeCycles.map(async (item) => {
          let alreadyMember = false;
          if (memberId) {
            const record = await PaymentRecordRepository.findByCycleAndMember(
              item.cycle.id,
              memberId,
            );
            alreadyMember = record !== null;
          }
          return { ...item, alreadyMember };
        }),
      );
      setActiveCycles(updated);
      const newCycleIds = new Set<string>(updated.map((c) => c.cycle.id));
      setSelectedCycleIds(newCycleIds);

      const updatedEvents = await Promise.all(
        upcomingEvents.map(async (item) => {
          let alreadyParticipant = false;
          if (memberId) {
            const participant =
              await EventParticipantRepository.findByEventAndMember(
                item.event.id,
                memberId,
              );
            alreadyParticipant = participant !== null;
          }
          return { ...item, alreadyParticipant };
        }),
      );
      setUpcomingEvents(updatedEvents);
      const newEventIds = new Set<string>(
        updatedEvents
          .filter((e) => e.alreadyParticipant)
          .map((e) => e.event.id),
      );
      setSelectedEventIds(newEventIds);
    },
    [activeCycles, upcomingEvents],
  );

  const handleMemberSelect = async (memberId: string) => {
    setSelectedMemberId(memberId);
    await refreshMemberships(memberId);
  };

  const handleModeChange = async (newMode: StudentMode) => {
    setMode(newMode);
    if (newMode === "new") {
      await refreshMemberships(null);
      setSelectedMemberId(null);
    }
  };

  // ── Toggle helpers ────────────────────────────────────────────────────────

  const toggleCycle = (cycleId: string) => {
    setSelectedCycleIds((prev) => {
      const next = new Set(prev);
      if (next.has(cycleId)) next.delete(cycleId);
      else next.add(cycleId);
      return next;
    });
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (mode === "existing" && !selectedMemberId) {
      Alert.alert(t("error"), t("approveJoinRequestSelectMember"));
      return;
    }

    setSubmitting(true);
    try {
      await approveJoinRequest(request.id, schoolId, {
        mode,
        existingMemberId: mode === "existing" ? selectedMemberId! : undefined,
        cycleIds: [...selectedCycleIds].filter((id) => {
          const item = activeCycles.find((c) => c.cycle.id === id);
          return item && !item.alreadyMember;
        }),
        eventIds: [...selectedEventIds].filter((id) => {
          const item = upcomingEvents.find((e) => e.event.id === id);
          return item && !item.alreadyParticipant;
        }),
      });

      onOpenChange(false);
      onApproved();
    } catch (err: any) {
      console.error("[ApproveJoinRequestSheet] submit error:", err);
      Alert.alert(t("error"), t("errorUpdateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[85]}
      dismissOnSnapToBottom
      zIndex={200}
    >
      <Sheet.Overlay
        backgroundColor="rgba(0,0,0,0.5)"
        opacity={0.5}
        zIndex={199}
      />
      <Sheet.Frame
        backgroundColor="$background"
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
        zIndex={200}
        flex={1}
      >
        <Sheet.Handle />

        {loading ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <ActivityIndicator />
          </YStack>
        ) : (
          <YStack flex={1}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
            >
              {/* Header */}
              <YStack marginBottom="$4">
                <Text fontSize="$6" fontWeight="700" color="$inkBlack">
                  {t("approveJoinRequestTitle")}
                </Text>
                <BaseCard onPress={() => {}} marginHorizontal="unset">
                  <XStack
                    gap="$3"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Thumbnail imageUrl={request.avatarUrl} />
                    <CardInfo
                      displayName={request.displayName}
                      subtitle={request.email ?? request.phoneNumber ?? ""}
                    />
                  </XStack>
                </BaseCard>
              </YStack>

              {/* Mode selection */}
              <Text
                fontSize="$4"
                fontWeight="600"
                color="$inkBlack"
                marginBottom="$2"
              >
                {t("approveJoinRequestStudentType")}
              </Text>
              <XStack gap="$2" marginBottom="$4">
                <ModeButton
                  label={t("approveJoinRequestNewStudent")}
                  selected={mode === "new"}
                  onPress={() => handleModeChange("new")}
                />
                <ModeButton
                  label={t("approveJoinRequestExistingStudent")}
                  selected={mode === "existing"}
                  onPress={() => handleModeChange("existing")}
                />
              </XStack>

              {/* Existing member picker */}
              {mode === "existing" && (
                <YStack marginBottom="$4">
                  <Text fontSize="$3" color="$inkBlackLight" marginBottom="$2">
                    {t("approveJoinRequestSelectExisting")}
                  </Text>
                  {existingMembers.length === 0 ? (
                    <Text fontSize="$3" color="$inkBlackLight">
                      {t("approveJoinRequestNoOfflineStudents")}
                    </Text>
                  ) : (
                    <YStack gap="$1">
                      {existingMembers.map((member) => (
                        <BaseCard
                          key={member.id}
                          onPress={() => handleMemberSelect(member.id)}
                          borderColor={
                            selectedMemberId === member.id
                              ? "$jadeGreen"
                              : undefined
                          }
                          marginHorizontal="unset"
                        >
                          <XStack
                            gap="$3"
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Thumbnail imageUrl={member.avatarUrl} size={40} />
                            <CardInfo
                              displayName={member.displayName ?? ""}
                              subtitle={
                                member.email ?? member.phoneNumber ?? ""
                              }
                            />

                            {selectedMemberId === member.id && (
                              <Check size={20} color={theme.jadeGreen?.val} />
                            )}
                          </XStack>
                        </BaseCard>
                      ))}
                    </YStack>
                  )}
                </YStack>
              )}

              {/* Active payment cycles */}
              {activeCycles.length > 0 && (
                <>
                  <Separator marginVertical="$3" />
                  <Text
                    fontSize="$4"
                    fontWeight="600"
                    color="$inkBlack"
                    marginBottom="$2"
                  >
                    {t("approveJoinRequestPaymentCycles")}
                  </Text>
                  <YStack gap="$1">
                    {activeCycles.map(({ cycle, alreadyMember }) => {
                      const isChecked = selectedCycleIds.has(cycle.id);
                      const start = new Date(
                        cycle.periodStart,
                      ).toLocaleDateString();
                      const end = new Date(
                        cycle.periodEnd,
                      ).toLocaleDateString();
                      return (
                        <BaseCard
                          key={cycle.id}
                          onPress={() =>
                            !alreadyMember && toggleCycle(cycle.id)
                          }
                          borderColor={
                            isChecked ? "$jadeGreen" : "$borderColor"
                          }
                          marginHorizontal="unset"
                        >
                          <XStack
                            gap="$3"
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Thumbnail
                              backgroundColor="$jadeGreenLighter"
                              borderColor="$jadeGreen"
                              icon={<Calendar />}
                            />
                            <YStack flex={1} pointerEvents="none">
                              <Text
                                fontSize="$4"
                                fontWeight="600"
                                color="$inkBlack"
                              >
                                {start} – {end}
                              </Text>
                              {alreadyMember && (
                                <Text fontSize="$2" color="$jadeGreen">
                                  {t("approveJoinRequestAlreadyInCycle")}
                                </Text>
                              )}
                            </YStack>
                            {isChecked && (
                              <Check size={20} color={theme.jadeGreen?.val} />
                            )}
                          </XStack>
                        </BaseCard>
                      );
                    })}
                  </YStack>
                </>
              )}

              {/* Upcoming events */}
              {upcomingEvents.length > 0 && (
                <>
                  <Separator marginVertical="$3" />
                  <Text
                    fontSize="$4"
                    fontWeight="600"
                    color="$inkBlack"
                    marginBottom="$2"
                  >
                    {t("approveJoinRequestUpcomingEvents")}
                  </Text>
                  <YStack gap="$1">
                    {upcomingEvents.map(({ event, alreadyParticipant }) => {
                      const isChecked = selectedEventIds.has(event.id);
                      const date = new Date(
                        event.startDate,
                      ).toLocaleDateString();
                      return (
                        <BaseCard
                          key={event.id}
                          onPress={() =>
                            !alreadyParticipant && toggleEvent(event.id)
                          }
                          borderColor={isChecked ? "$jadeGreen" : undefined}
                          marginHorizontal="unset"
                        >
                          <XStack
                            gap="$3"
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Thumbnail
                              backgroundColor="$chineseGoldLighter"
                              borderColor="$chineseGold"
                              icon={<CalendarDays />}
                            />
                            <CardInfo
                              displayName={event.name}
                              subtitle={date}
                            />
                            {alreadyParticipant && (
                              <Text fontSize="$2" color="$jadeGreen">
                                {t("approveJoinRequestAlreadyInEvent")}
                              </Text>
                            )}
                            {isChecked && (
                              <Check size={20} color={theme.jadeGreen?.val} />
                            )}
                          </XStack>
                        </BaseCard>
                      );
                    })}
                  </YStack>
                </>
              )}
            </ScrollView>
            <SubmitComponent
              onPress={handleSubmit}
              isLoading={submitting}
              title={t("joinRequestApprove")}
            />
          </YStack>
        )}
      </Sheet.Frame>
    </Sheet>
  );
};

// ============================================================================
// ModeButton (internal)
// ============================================================================

interface ModeButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

const ModeButton: React.FC<ModeButtonProps> = ({
  label,
  selected,
  onPress,
}) => (
  <Button
    flex={1}
    size="$3"
    backgroundColor={selected ? "$blue11" : "$softGray"}
    color={selected ? "$pearlWhite" : "$inkBlack"}
    fontWeight={selected ? "700" : "400"}
    onPress={onPress}
  >
    {label}
  </Button>
);
