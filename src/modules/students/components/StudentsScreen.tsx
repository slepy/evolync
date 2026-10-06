import {
  ListAvatar,
  ListCard,
  ListEmpty,
  ListRow,
  ListSection,
  MemberAvatar,
  SearchField,
  StatusBadge,
  SubScreenPage,
  ViewSwitch,
  memberInitials,
  withAlpha,
} from "@/core/components";
import { danger, moduleAccents, neutral, warning } from "@/core/theme/tokens";
import type SchoolJoinRequest from "@/database/models/SchoolJoinRequest";
import { LoadingScreen } from "@/modules/core/components/LoadingScreen";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { Check, QrCode, UserPlus, Users, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Alert, StyleSheet } from "react-native";
import { Text, View, XStack, YStack } from "tamagui";
import { useStudentsOverview } from "../hooks";
import { rejectJoinRequest } from "../services";
import { latestInvite, requestAge, studentStatusPill, visibleStudents } from "../studentList";
import { ApproveJoinRequestSheet } from "./ApproveJoinRequestSheet";
import { InviteCodeCard } from "./InviteCodeCard";

export type StudentsTab = "students" | "requests";

interface StudentsScreenProps {
  schoolId: string;
  initialTab?: StudentsTab;
  onStudentPress: (studentId: string) => void;
  onAddStudent: () => void;
  onNewInvite: () => void;
}

const localeTag = () => (t("locale") === "pl" ? "pl-PL" : "en-GB");
const shortDate = (date: Date | number) =>
  new Date(date).toLocaleDateString(localeTag(), { day: "numeric", month: "short" });

const PILL_COLOR = {
  neutral: { tint: neutral.tint, fill: neutral.tintFill },
  warning: { tint: warning.text, fill: warning.fill },
  muted: { tint: neutral.placeholder, fill: withAlpha(neutral.tint, 0.1) },
} as const;

/** "2 h ago", "Yesterday", "3 Oct" */
const requestAgeLabel = (sentAt: Date, now: Date): string => {
  const age = requestAge(sentAt, now);
  switch (age.kind) {
    case "justNow":
      return t("syncJustNow");
    case "minutes":
      return t("syncMinutesAgo", { minutes: age.count });
    case "hours":
      return t("syncHoursAgo", { hours: age.count });
    case "yesterday":
      return t("timeYesterday");
    default:
      return shortDate(sentAt);
  }
};

/**
 * Students (16A) and Join requests (16B) of a school: the active invite code
 * (tap copies it), the Students / Requests switch with the pending count,
 * the searchable list (avatar with the rank corner, status pill for students
 * without an account) and the requests with Reject / Approve in the row.
 */
export const StudentsScreen: React.FC<StudentsScreenProps> = ({
  schoolId,
  initialTab = "students",
  onStudentPress,
  onAddStudent,
  onNewInvite,
}) => {
  const { students, requests, invites, organizationId, isLoading } = useStudentsOverview(schoolId);
  const [tab, setTab] = useState<StudentsTab>(initialTab);
  const [query, setQuery] = useState("");
  const [approving, setApproving] = useState<SchoolJoinRequest | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const rows = useMemo(() => visibleStudents(students, query), [students, query]);
  const invite = latestInvite(invites);
  const now = new Date();

  const copyInvite = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
      Alert.alert(t("inviteCopiedTitle"), t("inviteCopiedMessage", { code }));
    } catch (error) {
      console.warn("[StudentsScreen] Clipboard error:", error);
      Alert.alert(t("errorUnknown"), t("inviteClipboardError"));
    }
  };

  const reject = (request: SchoolJoinRequest) =>
    Alert.alert(t("joinRequestRejectTitle"), t("joinRequestRejectMessage"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("joinRequestReject"),
        style: "destructive",
        onPress: async () => {
          setProcessingId(request.id);
          try {
            await rejectJoinRequest(request.id);
          } catch {
            Alert.alert(t("error"), t("errorUpdateFailed"));
          } finally {
            setProcessingId(null);
          }
        },
      },
    ]);

  if (isLoading) return <LoadingScreen />;

  return (
    <SubScreenPage title={t("studentsTitle")} context="school">
      <YStack gap={16}>
        {invite ? (
          <InviteCodeCard
            code={invite.code}
            expiresLabel={t("inviteExpiresAt", { date: shortDate(invite.expiresAt) })}
            onCopy={() => copyInvite(invite.code)}
          />
        ) : null}

        <ViewSwitch
          accent="students"
          aria-label={t("studentsTitle")}
          active={tab === "students" ? "first" : "second"}
          first={{ icon: Users, label: t("studentsTitle"), onPress: () => setTab("students") }}
          second={{ icon: UserPlus, label: t("joinRequests"), onPress: () => setTab("requests"), badge: requests.length }}
        />

        {tab === "students" ? (
          <ListSection
            title={t("studentsCount", { count: students.length })}
            accent="students"
            iconAction={{ icon: QrCode, label: t("inviteNewCode"), onPress: onNewInvite }}
            action={{ label: t("addNew"), onPress: onAddStudent }}
          >
            <YStack gap={12}>
              <SearchField
                value={query}
                onChangeText={setQuery}
                placeholder={t("studentsSearchPlaceholder")}
                accent="students"
              />
              {rows.length === 0 ? (
                <ListEmpty text={query ? t("ordersNoStudentsFound") : t("emptyNoStudents")} />
              ) : (
                <ListCard>
                  {rows.map((student) => {
                    const name = student.displayName || student.email || t("unknownMember");
                    const pill = studentStatusPill(student.status, student.userId);
                    return (
                      <ListRow
                        key={student.id}
                        size="md"
                        title={name}
                        subtitle={student.email ?? student.phoneNumber ?? undefined}
                        leading={<MemberAvatar name={name} uri={student.avatarUrl} rankId={student.currentRankId} />}
                        trailing={pill ? <StatusBadge label={t(pill.label)} color={PILL_COLOR[pill.tone]} /> : undefined}
                        onPress={() => onStudentPress(student.id)}
                      />
                    );
                  })}
                </ListCard>
              )}
            </YStack>
          </ListSection>
        ) : (
          <ListSection title={t("joinRequestsTitle")} subtitle={t("joinRequestsHint")}>
            {requests.length === 0 ? (
              <ListEmpty text={t("joinRequestsEmpty")} />
            ) : (
              <ListCard>
                {requests.map((request) => {
                  const name = request.displayName || request.email || t("unknownMember");
                  const busy = processingId === request.id;
                  return (
                    <ListRow
                      key={request.id}
                      size="md"
                      title={name}
                      subtitle={[request.email || request.phoneNumber, requestAgeLabel(request.createdAt, now)]
                        .filter(Boolean)
                        .join(" · ")}
                      leading={<ListAvatar initials={memberInitials(name)} uri={request.avatarUrl} />}
                      trailing={
                        <XStack gap={8} opacity={busy ? 0.5 : 1}>
                          <RejectButton label={t("joinRequestRejectName", { name })} onPress={busy ? undefined : () => reject(request)} />
                          <ApproveButton
                            label={t("joinRequestApproveName", { name })}
                            onPress={busy || !organizationId ? undefined : () => setApproving(request)}
                          />
                        </XStack>
                      }
                    />
                  );
                })}
              </ListCard>
            )}
          </ListSection>
        )}
      </YStack>

      {approving && organizationId ? (
        <ApproveJoinRequestSheet
          open
          onOpenChange={(open) => {
            if (!open) setApproving(null);
          }}
          request={approving}
          schoolId={schoolId}
          organizationId={organizationId}
          onApproved={() => setApproving(null)}
        />
      ) : null}
    </SubScreenPage>
  );
};

/** 44px round reject button: red outline, x (16B). */
function RejectButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <View
      role="button"
      aria-label={label}
      onPress={onPress}
      pressStyle={{ opacity: 0.8 }}
      width={44}
      height={44}
      borderRadius={22}
      borderWidth={1}
      borderColor={danger.border}
      backgroundColor={danger.fill}
      alignItems="center"
      justifyContent="center"
    >
      <X size={20} color={danger.text} strokeWidth={2.4} />
    </View>
  );
}

/** 44px round approve button in the Students gradient, check (16B). */
function ApproveButton({ label, onPress }: { label: string; onPress?: () => void }) {
  const accent = moduleAccents.students;
  return (
    <View
      role="button"
      aria-label={label}
      onPress={onPress}
      pressStyle={{ opacity: 0.85 }}
      width={44}
      height={44}
      borderRadius={22}
      overflow="hidden"
      alignItems="center"
      justifyContent="center"
    >
      <LinearGradient colors={[accent.from, accent.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Check size={20} color={accent.buttonText} strokeWidth={2.8} />
    </View>
  );
}
