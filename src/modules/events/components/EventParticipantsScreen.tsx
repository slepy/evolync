import { ListCard, ListRow, MemberAvatar, PrimaryButton, SubScreenPage, ToggleRow } from "@/core/components";
import { neutral } from "@/core/theme/tokens";
import { GraduationCap } from "lucide-react-native";
import React, { useState, type ReactNode } from "react";
import { ActivityIndicator } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { nextParticipantStatus } from "../constants";
import { useEvent } from "../hooks/useEvent";
import { useEventParticipants } from "../hooks/useEventParticipants";
import type { ParticipantContentProps } from "../types";
import { countExamTakers } from "./participantDrafts";
import { ParticipantSummary } from "./ParticipantSummary";
import { ParticipantStatusButton } from "./ParticipantStatusButton";

interface EventParticipantsScreenProps {
  eventId: string;
  /** After Save: back to the details. */
  onSaved: () => void;
  /**
   * Extra content under a participant (Phase 2: their event orders and Add
   * order), filled by the route so `events` does not import `orders`.
   */
  renderParticipantContent?: (participant: ParticipantContentProps) => ReactNode;
  /** Changes of the extra content waiting for Save (event order drafts). */
  extraChanges?: boolean;
  /** Stores the extra changes; runs on Save before the statuses. */
  onSaveExtra?: () => Promise<void>;
}

/**
 * Participants (10D / 10D1): the event name, the static Status summary, member
 * rows whose round status button cycles on tap; with exams planned a "Takes
 * exam" switch (stored right away) under every row and the exam-taker count.
 * Save appears after a status change or an extra change.
 */
export const EventParticipantsScreen: React.FC<EventParticipantsScreenProps> = ({
  eventId,
  onSaved,
  renderParticipantContent,
  extraChanges = false,
  onSaveExtra,
}) => {
  const { event } = useEvent(eventId);
  const { participantList, counts, isLoading, isSaving, error, hasStatusChanges, toggleStatus, setTakesExam, saveAll } =
    useEventParticipants(eventId);
  const [extraError, setExtraError] = useState<string | null>(null);
  const [isSavingExtra, setIsSavingExtra] = useState(false);
  const changed = hasStatusChanges || extraChanges;
  const examsPlanned = !!event?.examsPlanned;
  const busy = isSaving || isSavingExtra;

  const handleSave = async () => {
    setExtraError(null);
    try {
      if (extraChanges && onSaveExtra) {
        setIsSavingExtra(true);
        try {
          await onSaveExtra();
        } catch (err) {
          setExtraError(t(err instanceof Error ? err.message : "errorSaveFailed"));
          throw err;
        } finally {
          setIsSavingExtra(false);
        }
      }
      if (hasStatusChanges) await saveAll();
      onSaved();
    } catch {
      // The hook (statuses) or extraError keeps the message, shown above the button.
    }
  };

  const message = extraError ?? error;

  return (
    <SubScreenPage
      title={t("eventsParticipants")}
      footer={
        changed ? (
          <YStack gap={10}>
            {message ? (
              <Text fontSize={12.5} fontWeight="$secondary" color="$trashText" textAlign="center">
                {message}
              </Text>
            ) : null}
            <PrimaryButton label={t("save")} accent="events" onPress={handleSave} loading={busy} />
          </YStack>
        ) : undefined
      }
    >
      {event ? (
        <Text fontSize="$section" fontWeight="$section" color="$neutralText">
          {event.name}
        </Text>
      ) : null}
      <YStack gap={10}>
        <ParticipantSummary counts={counts} />
        {examsPlanned ? (
          <XStack alignItems="center" gap={7} paddingHorizontal={4}>
            <GraduationCap size={15} color={neutral.muted} strokeWidth={2.2} />
            <Text fontSize={13} fontWeight="600" color="$neutralMuted">
              {t("eventsExamTakersCount", { count: countExamTakers(participantList) })}
            </Text>
          </XStack>
        ) : null}
      </YStack>
      <Text fontSize={13} fontWeight="$secondary" color="$neutralMuted">
        {examsPlanned ? t("eventsExamsStatusHint") : t("eventsStatusHint")}
      </Text>
      {!changed && message ? (
        <Text fontSize={12.5} fontWeight="$secondary" color="$trashText">
          {message}
        </Text>
      ) : null}
      {isLoading ? (
        <ActivityIndicator />
      ) : participantList.length === 0 ? (
        <YStack gap={4} alignItems="center" paddingVertical={24}>
          <Text fontSize={15} fontWeight="$rowTitle" color="$neutralText" textAlign="center">
            {t("emptyNoParticipants")}
          </Text>
          <Text fontSize={13} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
            {t("emptyNoParticipantsHint")}
          </Text>
        </YStack>
      ) : (
        <ListCard>
          {participantList.map((item) => {
            const name = item.member.displayName || t("unknownMember");
            const extra = renderParticipantContent?.({
              schoolMemberId: item.member.id,
              name,
              takesExam: item.takesExam,
              examsPlanned,
            });
            const hasContent = examsPlanned || !!extra;
            return (
              <ListRow
                key={item.participant.id}
                size="md"
                title={name}
                subtitle={item.member.email}
                leading={<MemberAvatar name={name} uri={item.member.avatarUrl} rankId={item.member.currentRankId} />}
                trailing={
                  <ParticipantStatusButton
                    status={item.status}
                    disabled={busy}
                    onPress={() => toggleStatus(item.participant.id, nextParticipantStatus(item.status))}
                  />
                }
                expanded={hasContent}
              >
                {hasContent ? (
                  <YStack gap={10} marginLeft={56}>
                    {examsPlanned ? (
                      <ToggleRow
                        title={t("eventsTakesExam")}
                        label={t("eventsTakesExamLabel", { name })}
                        checked={item.takesExam}
                        onChange={(checked) => setTakesExam(item.participant.id, checked)}
                        accent="events"
                        disabled={busy}
                      />
                    ) : null}
                    {extra}
                  </YStack>
                ) : undefined}
              </ListRow>
            );
          })}
        </ListCard>
      )}
    </SubScreenPage>
  );
};
