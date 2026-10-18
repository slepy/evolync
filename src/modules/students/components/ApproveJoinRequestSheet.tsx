import SchoolJoinRequest from "@/database/models/SchoolJoinRequest";
import SchoolMember from "@/database/models/SchoolMember";
import Event from "@/database/models/Event";
import PaymentCycle from "@/database/models/PaymentCycle";
import { StudentRepository } from "../repositories";
import {
  formatPhoneNumber,
  parsePhoneNumber,
} from "@/core/utils/phoneHelpers";
import { PaymentCycleRepository } from "@/modules/payments/repositories/paymentCycleRepository";
import { PaymentRecordRepository } from "@/modules/payments/repositories/paymentRecordRepository";
import { EventRepository } from "@/modules/events/repositories/eventRepository";
import { EventParticipantRepository } from "@/modules/events/repositories/eventParticipantRepository";
import { approveJoinRequest } from "../services";
import {
  ChoiceList,
  FormSheet,
  ListAvatar,
  ListCard,
  ListCheck,
  ListCheckbox,
  ListEmpty,
  ListIcon,
  ListRow,
  ListSection,
  MemberAvatar,
  PrimaryButton,
  memberInitials,
} from "@/core/components";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView } from "react-native";
import { YStack } from "tamagui";
import { CalendarDays, Wallet } from "lucide-react-native";

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
  const loadData = async () => {
    setLoading(true);
    try {
      // Load existing offline (shadow) members only — active/archived members
      // are not valid link targets for a new join request
      const members = await StudentRepository.findOfflineBySchoolId(schoolId);
      setExistingMembers(members);

      // Auto-select member with matching email or phone (normalized so casing/
      // whitespace/formatting differences don't cause a missed match)
      const normalizedEmail = request.email?.trim().toLowerCase();
      const normalizedPhone = formatPhoneNumber(
        parsePhoneNumber(request.phoneNumber),
      );
      const matched = members.find((m) => {
        const memberEmail = m.email?.trim().toLowerCase();
        const memberPhone = formatPhoneNumber(parsePhoneNumber(m.phoneNumber));
        return (
          (normalizedEmail && memberEmail === normalizedEmail) ||
          (normalizedPhone && memberPhone === normalizedPhone)
        );
      });
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

  const name = request.displayName || request.email || t("unknownMember");
  const shortDate = (date: Date | number) => new Date(date).toLocaleDateString();

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      fill
      leading={<ListAvatar initials={memberInitials(name)} uri={request.avatarUrl} />}
      title={t("approveJoinRequestTitle")}
      subtitle={[name, request.email ?? request.phoneNumber].filter(Boolean).join(" · ")}
      footer={
        <PrimaryButton
          label={t("joinRequestApprove")}
          accent="students"
          onPress={handleSubmit}
          loading={submitting}
          disabled={loading}
        />
      }
    >
      {loading ? (
        <YStack flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator />
        </YStack>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 20, paddingBottom: 8 }}>
          <ChoiceList
            title={t("approveJoinRequestStudentType")}
            accent="students"
            value={mode}
            onChange={handleModeChange}
            options={[
              { value: "new", title: t("approveJoinRequestNewStudent") },
              { value: "existing", title: t("approveJoinRequestExistingStudent") },
            ]}
          />

          {mode === "existing" ? (
            <ListSection variant="label" title={t("approveJoinRequestSelectExisting")}>
              {existingMembers.length === 0 ? (
                <ListEmpty text={t("approveJoinRequestNoOfflineStudents")} />
              ) : (
                <ListCard role="radiogroup">
                  {existingMembers.map((member) => {
                    const memberName = member.displayName || member.email || t("unknownMember");
                    const selected = selectedMemberId === member.id;
                    return (
                      <ListRow
                        key={member.id}
                        size="md"
                        role="radio"
                        aria-checked={selected}
                        title={memberName}
                        subtitle={member.email ?? member.phoneNumber ?? undefined}
                        leading={<MemberAvatar name={memberName} uri={member.avatarUrl} rankId={member.currentRankId} />}
                        trailing={selected ? <ListCheck accent="students" /> : undefined}
                        accent="students"
                        onPress={() => handleMemberSelect(member.id)}
                      />
                    );
                  })}
                </ListCard>
              )}
            </ListSection>
          ) : null}

          {activeCycles.length > 0 ? (
            <ListSection variant="label" title={t("approveJoinRequestPaymentCycles")}>
              <ListCard role="group">
                {activeCycles.map(({ cycle, alreadyMember }) => {
                  const checked = selectedCycleIds.has(cycle.id);
                  return (
                    <ListRow
                      key={cycle.id}
                      size="md"
                      role="checkbox"
                      aria-checked={checked}
                      title={`${shortDate(cycle.periodStart)} – ${shortDate(cycle.periodEnd)}`}
                      subtitle={alreadyMember ? t("approveJoinRequestAlreadyInCycle") : undefined}
                      leading={<ListIcon icon={Wallet} accent="payments" size={44} />}
                      trailing={<ListCheckbox checked={checked} accent="students" />}
                      onPress={alreadyMember ? undefined : () => toggleCycle(cycle.id)}
                    />
                  );
                })}
              </ListCard>
            </ListSection>
          ) : null}

          {upcomingEvents.length > 0 ? (
            <ListSection variant="label" title={t("approveJoinRequestUpcomingEvents")}>
              <ListCard role="group">
                {upcomingEvents.map(({ event, alreadyParticipant }) => {
                  const checked = selectedEventIds.has(event.id);
                  return (
                    <ListRow
                      key={event.id}
                      size="md"
                      role="checkbox"
                      aria-checked={checked}
                      title={event.name}
                      subtitle={
                        alreadyParticipant
                          ? `${shortDate(event.startDate)} · ${t("approveJoinRequestAlreadyInEvent")}`
                          : shortDate(event.startDate)
                      }
                      leading={<ListIcon icon={CalendarDays} accent="events" size={44} />}
                      trailing={<ListCheckbox checked={checked} accent="students" />}
                      onPress={alreadyParticipant ? undefined : () => toggleEvent(event.id)}
                    />
                  );
                })}
              </ListCard>
            </ListSection>
          ) : null}
        </ScrollView>
      )}
    </FormSheet>
  );
};
