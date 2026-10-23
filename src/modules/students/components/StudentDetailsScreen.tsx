import {
  CurrencySheet,
  IconTabs,
  ListAvatar,
  ListCard,
  ListEmpty,
  ListIcon,
  ListRow,
  PrimaryButton,
  SelectField,
  StatusBadge,
  StatusButton,
  StatusSummary,
  SubScreenPage,
  SyncedPill,
  memberInitials,
  ratePercent,
  withAlpha,
  type StatusSummaryItem,
} from "@/core/components";
import { neutral } from "@/core/theme/tokens";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "@/core/utils/currencies";
import { STATUS_CYCLE as ATTENDANCE_CYCLE } from "@/database/models/AttendanceRecord";
import type SchoolMember from "@/database/models/SchoolMember";
import { ATTENDANCE_STATUS_STYLE, ATTENDANCE_SUMMARY_ORDER } from "@/modules/attendance/constants";
import { useStudentAttendance } from "@/modules/attendance/hooks";
import { LoadingScreen } from "@/core/components";
import { useDirtyFlag } from "@/core/hooks";
import { formatPrice } from "@/core/utils/formatters";
import { PARTICIPANT_STATUS_STYLE, PARTICIPANT_SUMMARY_ORDER } from "@/modules/events/constants";
import { formatEventDates } from "@/modules/events/components/formatEventDates";
import { useStudentEvents, useStudentEventStatuses } from "@/modules/events/hooks";
import { RankIcon } from "@/modules/grading/components";
import { useGradingRanks } from "@/modules/grading/hooks/useGradingRanks";
import { ORDER_STATUS_STYLE } from "@/modules/orders/components/orderListState";
import { formatOrderDay, formatOrderTotals } from "@/modules/orders/components/orderFormat";
import { useMemberOrders } from "@/modules/orders/hooks/useMemberOrders";
import { OrderEventLine } from "@/modules/orders/components/OrderEventLine";
import { PAYMENT_STATUS_STYLE, PAYMENT_SUMMARY_ORDER } from "@/modules/payments/constants";
import { useStudentPayments } from "@/modules/payments/hooks/useStudentPayments";
import {
  dateLocaleTag,
  describePeriod,
  formatAmount,
  nextPaymentStatus,
  parseAmount,
  storedDayKey,
} from "@/modules/payments/paymentPeriod";
import { SchoolRepository, SchoolSettingsRepository } from "@/modules/school/repositories";
import { timestampToDay } from "@/modules/trainings/types/helpers";
import {
  CalendarCheck,
  CalendarDays,
  CreditCard,
  Mail,
  MoreVertical,
  Phone,
  ShoppingBag,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, Linking } from "react-native";
import { Text, View, XStack, YStack } from "tamagui";
import { StudentRepository } from "../repositories";
import { archiveStudent, assignRankToStudent, setStudentPaymentAmount } from "../services";
import { MemberStatus, getDisplayStatus, type StudentPaymentAmountDraft } from "../types";
import { studentStatusPill } from "../studentList";
import { StudentPaymentAmountSheet } from "./StudentPaymentAmountSheet";
import { StudentActionsSheet } from "./StudentActionsSheet";
import { StudentRankSheet } from "./StudentRankSheet";
import { STUDENT_PILL_COLOR } from "./studentStatusStyle";
import { EventHistoryRow } from "./EventHistoryRow";

type HistoryTab = "payments" | "attendance" | "orders" | "events";

const METHOD_LABEL = { cash: "paymentsMethodCash", transfer: "paymentsMethodTransfer", other: "paymentsMethodOther" } as const;

interface StudentDetailsScreenProps {
  schoolId: string;
  studentId: string;
  onOpenOrder: (orderId: string) => void;
  onEdit: () => void;
  /** After Archive: back to the list. */
  onArchived: () => void;
}

/**
 * Student details (16E–16E3): profile card (avatar with the rank corner,
 * status, joined date, email / phone, RANK field opening 16F), History tabs
 * with a Status summary and rows whose status button cycles on tap, Orders
 * opening their details; Save after a change. ⋮ opens 16G (Edit, Archive).
 * PAYMENT AMOUNT, on top of the Payments tab above its summary, opens the student's
 * own fee for new periods (or the school default).
 */
export const StudentDetailsScreen: React.FC<StudentDetailsScreenProps> = ({
  schoolId,
  studentId,
  onOpenOrder,
  onEdit,
  onArchived,
}) => {
  const [student, setStudent] = useState<SchoolMember | null>(null);
  const [school, setSchool] = useState<{ name: string; organizationId: string } | null>(null);
  const [tab, setTab] = useState<HistoryTab>("payments");
  const [sheet, setSheet] = useState<"rank" | "actions" | "fee" | "feeCurrency" | null>(null);
  const [schoolDefault, setSchoolDefault] = useState<{ amount: number; currency: string } | null>(null);
  const [feeDraft, setFeeDraft] = useState<StudentPaymentAmountDraft>({ useDefault: true, amount: "", currency: DEFAULT_CURRENCY });
  const [feeSaving, setFeeSaving] = useState(false);
  const [pendingRankId, setPendingRankId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const subscription = StudentRepository.observeById(studentId).subscribe({
      next: setStudent,
      error: (err: Error) => console.error("[StudentDetails] Student error:", err),
    });
    return () => subscription.unsubscribe();
  }, [studentId]);

  useEffect(() => {
    SchoolRepository.findById(schoolId)
      .then((s) => s && setSchool({ name: s.name, organizationId: s.organizationId }))
      .catch((err) => console.error("[StudentDetails] School error:", err));
  }, [schoolId]);

  useEffect(() => {
    const subscription = SchoolSettingsRepository.observeBySchoolId(schoolId).subscribe({
      next: ([settings]) =>
        setSchoolDefault(
          settings ? { amount: settings.defaultPaymentAmount ?? 0, currency: settings.defaultCurrency || DEFAULT_CURRENCY } : null,
        ),
      error: (err: Error) => console.error("[StudentDetails] Settings error:", err),
    });
    return () => subscription.unsubscribe();
  }, [schoolId]);

  const { ranks } = useGradingRanks(school?.organizationId ?? "");
  const payments = useStudentPayments(studentId);
  const attendance = useStudentAttendance(studentId);
  const { orders, isLoading: ordersLoading } = useMemberOrders(studentId);
  const { events: studentEvents, isLoading: eventsLoading } = useStudentEvents(studentId);
  const events = useStudentEventStatuses(studentEvents, { isInstructor: true });

  // The hooks' change flags go back to false when an edit is reverted; Save follows the one-way dirty flag.
  const rankChanged = pendingRankId !== undefined;
  const changed = payments.hasChanges || attendance.hasChanges || events.hasChanges || rankChanged;
  const { isDirty, markDirty, reset } = useDirtyFlag();
  useEffect(() => {
    if (changed) markDirty();
  }, [changed, markDirty]);
  const isSaving = payments.isSaving || attendance.isSaving || events.isSaving;
  const [saveError, setSaveError] = useState<string | undefined>();

  if (!student) return <LoadingScreen />;

  const name = student.displayName || student.email || t("unknownMember");
  const displayStatus = getDisplayStatus(student.status, student.userId);
  const rankId = rankChanged ? pendingRankId : (student.currentRankId ?? null);
  const rank = rankId ? ranks.find((r) => r.id === rankId) : undefined;
  const locale = dateLocaleTag(t("locale"));

  const handleSave = async () => {
    setSaveError(undefined);
    try {
      await Promise.all([
        payments.hasChanges ? payments.saveAll() : undefined,
        attendance.hasChanges ? attendance.saveAll() : undefined,
        events.hasChanges ? events.saveAll() : undefined,
        rankChanged ? assignRankToStudent(student.id, pendingRankId ?? null) : undefined,
      ]);
      setPendingRankId(undefined);
      reset();
    } catch (err) {
      console.error("[StudentDetails] Save error:", err);
      setSaveError(t("errorSaveFailed"));
    }
  };

  const ownFee =
    student.paymentAmount != null && student.paymentCurrency
      ? `${formatAmount(student.paymentAmount)} ${student.paymentCurrency}`
      : null;
  const schoolDefaultText = schoolDefault ? `${formatAmount(schoolDefault.amount)} ${schoolDefault.currency}` : undefined;

  const openFee = () => {
    setFeeDraft({
      useDefault: !ownFee,
      amount: formatAmount(student.paymentAmount ?? schoolDefault?.amount ?? 0),
      currency: student.paymentCurrency ?? schoolDefault?.currency ?? DEFAULT_CURRENCY,
    });
    setSheet("fee");
  };

  const handleSaveFee = async () => {
    const amount = parseAmount(feeDraft.amount);
    if (!feeDraft.useDefault && amount === null) return;
    setFeeSaving(true);
    try {
      await setStudentPaymentAmount(student.id, feeDraft.useDefault ? null : { amount: amount!, currency: feeDraft.currency });
      setSheet(null);
    } catch (err) {
      console.error("[StudentDetails] Payment amount error:", err);
      Alert.alert(t("errorSaveFailed"));
    } finally {
      setFeeSaving(false);
    }
  };

  const handleArchive = () =>
    Alert.alert(t("studentArchiveTitle"), t("studentArchiveMessage"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("archive"),
        style: "destructive",
        onPress: async () => {
          try {
            await archiveStudent(studentId);
            onArchived();
          } catch (err) {
            console.error("[StudentDetails] Archive error:", err);
          }
        },
      },
    ]);

  const pill = studentStatusPill(student.status, student.userId);

  return (
    <SubScreenPage
      title={t("student")}
      context="school"
      right={
        <XStack alignItems="center" gap={8}>
          <SyncedPill />
          <View
            role="button"
            aria-label={t("studentMoreActions")}
            onPress={() => setSheet("actions")}
            pressStyle={{ opacity: 0.8 }}
            width={44}
            height={44}
            borderRadius={22}
            borderWidth={1}
            borderColor="$neutralRaisedBorder"
            backgroundColor="$neutralCard"
            alignItems="center"
            justifyContent="center"
          >
            <MoreVertical size={20} color={neutral.text} strokeWidth={2.4} />
          </View>
        </XStack>
      }
      footer={
        isDirty ? (
          <YStack gap={10}>
            {saveError ? (
              <Text fontSize={12.5} fontWeight="$secondary" color="$trashText" textAlign="center">
                {saveError}
              </Text>
            ) : null}
            <PrimaryButton label={t("save")} accent="students" onPress={handleSave} loading={isSaving} />
          </YStack>
        ) : undefined
      }
    >
      <YStack gap={16}>
        {/* Profile */}
        <YStack gap={16} padding={16} borderRadius="$card" borderWidth={1} borderColor="$neutralCardBorder" backgroundColor="$neutralCard">
          <XStack alignItems="center" gap={14}>
            <ListAvatar size={64} initials={memberInitials(name)} uri={student.avatarUrl} rankColor={rank?.color} />
            <YStack flex={1} minWidth={0} gap={6}>
              <Text fontSize={20} fontWeight="$section" letterSpacing={-0.2} color="$neutralText" numberOfLines={1}>
                {name}
              </Text>
              <XStack alignItems="center" gap={8} flexWrap="wrap">
                {pill ? (
                  <StatusBadge label={t(pill.label)} color={STUDENT_PILL_COLOR[pill.tone]} />
                ) : (
                  <StatusBadge label={t("statusActive")} color={STUDENT_PILL_COLOR.active} />
                )}
                {student.joinedAt ? (
                  <Text fontSize={12.5} fontWeight="600" color="$neutralMuted">
                    {t("studentJoined", {
                      date: student.joinedAt.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }),
                    })}
                  </Text>
                ) : null}
              </XStack>
            </YStack>
          </XStack>

          {student.email || student.phoneNumber ? (
            <YStack gap={10}>
              {student.email ? (
                <ContactLine icon={Mail} text={student.email} onPress={() => Linking.openURL(`mailto:${student.email}`)} />
              ) : null}
              {student.phoneNumber ? (
                <ContactLine icon={Phone} text={student.phoneNumber} onPress={() => Linking.openURL(`tel:${student.phoneNumber}`)} />
              ) : null}
            </YStack>
          ) : null}

          <SelectField
            label={t("fieldRank")}
            value={rank?.name ?? t("gradingNoRank")}
            leading={<RankIcon color={rank?.color} size={44} empty={!rank} />}
            onPress={() => setSheet("rank")}
            open={sheet === "rank"}
            accent="students"
            inset
          />
        </YStack>

        <IconTabs
          aria-label={t("student")}
          active={tab}
          onChange={setTab}
          tabs={[
            { key: "payments", icon: CreditCard, label: t("paymentsTitle"), accent: "payments" },
            { key: "attendance", icon: CalendarCheck, label: t("attendanceTitle"), accent: "attendance" },
            { key: "orders", icon: ShoppingBag, label: t("orders"), accent: "orders" },
            { key: "events", icon: CalendarDays, label: t("eventsTitle"), accent: "events" },
          ]}
        />

        {tab === "payments" ? (
          <SelectField
            label={t("studentPaymentAmount")}
            value={ownFee ?? (schoolDefaultText ? t("studentSchoolDefaultValue", { amount: schoolDefaultText }) : t("studentSchoolDefault"))}
            leading={<ListIcon icon={CreditCard} accent="payments" size={44} />}
            onPress={openFee}
            open={sheet === "fee" || sheet === "feeCurrency"}
            accent="payments"
          />
        ) : null}

        {tab === "payments" ? (
          payments.payments.length === 0 ? (
            <ListEmpty text={t("emptyNoPayments")} />
          ) : (
            <>
              <StatusSummary
                title={t("studentPeriodsCount", { count: payments.stats.total })}
                subtitle={t("studentPaidPendingSummary", { paid: payments.stats.paid, pending: payments.stats.pending })}
                accent="payments"
                items={PAYMENT_SUMMARY_ORDER.map((status) => summaryItem(status, payments.stats[status], PAYMENT_STATUS_STYLE[status]))}
              />
              <Hint text={t("studentPaymentsStatusHint")} />
              <ListCard>
                {payments.payments.map((item) => {
                  const style = PAYMENT_STATUS_STYLE[item.status];
                  const amount = `${formatAmount(item.amount)} ${item.currency}`;
                  return (
                    <ListRow
                      key={item.recordId}
                      size="md"
                      title={describePeriod(storedDayKey(item.cycle.periodStart), storedDayKey(item.cycle.periodEnd), locale).title}
                      subtitle={item.status === "paid" ? `${amount} · ${t(METHOD_LABEL[item.method])}` : amount}
                      leading={<ListIcon icon={CreditCard} accent="payments" size={44} />}
                      trailing={
                        <StatusButton
                          icon={style.icon}
                          color={{ tint: style.tint, fill: style.fill }}
                          label={t("statusChangeNow", { status: t(style.label) })}
                          disabled={isSaving}
                          onPress={() =>
                            payments.updateLocal(item.recordId, {
                              status: nextPaymentStatus(item.status),
                              amount: item.amount,
                              currency: item.currency,
                              method: item.method,
                            })
                          }
                        />
                      }
                    />
                  );
                })}
              </ListCard>
            </>
          )
        ) : null}

        {tab === "attendance" ? (
          attendance.attendance.length === 0 ? (
            <ListEmpty text={t("emptyNoAttendance")} />
          ) : (
            <>
              <StatusSummary
                title={t("studentSessionsCount", { count: attendance.stats.total })}
                subtitle={t("attendancePresentSummary", {
                  count: attendance.stats.present,
                  percent: ratePercent(attendance.stats.present, attendance.stats.total),
                })}
                accent="attendance"
                items={ATTENDANCE_SUMMARY_ORDER.map((status) =>
                  summaryItem(status, attendance.stats[status], ATTENDANCE_STATUS_STYLE[status]),
                )}
              />
              <Hint text={t("attendanceStatusHint")} />
              <ListCard>
                {attendance.attendance.map((item) => {
                  const style = ATTENDANCE_STATUS_STYLE[item.localStatus];
                  const next = ATTENDANCE_CYCLE[(ATTENDANCE_CYCLE.indexOf(item.localStatus) + 1) % ATTENDANCE_CYCLE.length]!;
                  const day = item.session.sessionDate.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
                  return (
                    <ListRow
                      key={item.record.id}
                      size="md"
                      title={day.charAt(0).toUpperCase() + day.slice(1)}
                      subtitle={school?.name}
                      leading={<ListIcon icon={CalendarCheck} accent="attendance" size={44} />}
                      trailing={
                        <StatusButton
                          icon={style.icon}
                          color={{ tint: style.tint, fill: style.fill }}
                          label={t("statusChangeNow", { status: t(style.label) })}
                          disabled={isSaving}
                          onPress={() => attendance.updateAttendanceStatusLocal(item.record.id, next)}
                        />
                      }
                    />
                  );
                })}
              </ListCard>
            </>
          )
        ) : null}

        {tab === "orders" ? (
          ordersLoading ? null : orders.length === 0 ? (
            <ListEmpty text={t("emptyNoOrders")} />
          ) : (
            <>
              <Hint text={t("studentOrdersHint")} />
              <ListCard>
                {orders.map((item) => {
                  const style = ORDER_STATUS_STYLE[item.order.status];
                  return (
                    <ListRow
                      key={item.order.id}
                      size="md"
                      title={item.itemCount === 1 && item.productName ? item.productName : t("ordersItemsCount", { count: item.itemCount })}
                      subtitle={[t("ordersItemsCount", { count: item.itemCount }), formatOrderDay(item.order.createdAt)].join(" · ")}
                      meta={item.eventName ? <OrderEventLine name={item.eventName} /> : undefined}
                      leading={<ListIcon icon={ShoppingBag} accent="orders" size={44} />}
                      trailing={
                        <YStack alignItems="flex-end" gap={5} flexShrink={0}>
                          <Text fontSize={14} fontWeight="$button" color="$neutralText" numberOfLines={1}>
                            {formatOrderTotals(item.totalsByCurrency)}
                          </Text>
                          <StatusBadge label={t(style.label)} color={style.accent} />
                        </YStack>
                      }
                      onPress={() => onOpenOrder(item.order.id)}
                    />
                  );
                })}
              </ListCard>
            </>
          )
        ) : null}

        {tab === "events" ? (
          eventsLoading ? null : events.localEvents.length === 0 ? (
            <ListEmpty text={t("emptyNoEvents")} />
          ) : (
            <>
              <StatusSummary
                title={t("studentEventsCount", { count: events.localEvents.length })}
                subtitle={t("eventsComingCount", {
                  count: events.localEvents.filter((e) => e.localStatus !== "absent").length,
                })}
                accent="events"
                items={PARTICIPANT_SUMMARY_ORDER.map((status) => {
                  const style = PARTICIPANT_STATUS_STYLE[status];
                  return {
                    key: status,
                    count: events.localEvents.filter((e) => e.localStatus === status).length,
                    label: t(style.label),
                    icon: style.icon,
                    barColor: style.barColor,
                    iconColor: style.tint,
                  };
                })}
              />
              <Hint text={t("studentEventsStatusHint")} />
              <ListCard>
                {events.localEvents.map((item) => {
                  const style = PARTICIPANT_STATUS_STYLE[item.localStatus];
                  const { event } = item;
                  return (
                    <EventHistoryRow
                      key={item.participantId}
                      title={event.name}
                      amount={event.price > 0 ? formatPrice(event.price, event.currency) : undefined}
                      when={formatEventDates(timestampToDay(event.startDate), timestampToDay(event.endDate))}
                      place={event.address}
                      note={event.shortNote}
                      status={
                        <StatusButton
                          icon={style.icon}
                          color={{ tint: style.tint, fill: withAlpha(style.tint, 0.16) }}
                          label={t("statusChangeNow", { status: t(style.label) })}
                          disabled={isSaving}
                          onPress={() => events.toggleStatus(item.participantId)}
                        />
                      }
                    />
                  );
                })}
              </ListCard>
            </>
          )
        ) : null}
      </YStack>

      <StudentRankSheet
        open={sheet === "rank"}
        onOpenChange={(open) => setSheet(open ? "rank" : null)}
        ranks={ranks}
        value={rankId ?? null}
        onSelect={(id) => setPendingRankId(id === (student.currentRankId ?? null) ? undefined : id)}
      />
      <StudentPaymentAmountSheet
        open={sheet === "fee"}
        onOpenChange={(open) => setSheet(open ? "fee" : null)}
        name={name}
        avatarUrl={student.avatarUrl}
        rankId={rankId}
        schoolDefault={schoolDefaultText}
        draft={feeDraft}
        onChange={setFeeDraft}
        onCurrencyPress={() => setSheet("feeCurrency")}
        onSave={handleSaveFee}
        saving={feeSaving}
      />
      <CurrencySheet
        open={sheet === "feeCurrency"}
        onOpenChange={(open) => setSheet(open ? "feeCurrency" : "fee")}
        options={SUPPORTED_CURRENCIES}
        value={feeDraft.currency}
        accent="payments"
        onSelect={(currency) => {
          setFeeDraft({ ...feeDraft, currency });
          setSheet("fee");
        }}
      />
      <StudentActionsSheet
        open={sheet === "actions"}
        onOpenChange={(open) => setSheet(open ? "actions" : null)}
        name={name}
        onEdit={displayStatus === MemberStatus.OFFLINE ? onEdit : undefined}
        onArchive={handleArchive}
      />
    </SubScreenPage>
  );
};

function summaryItem(
  key: string,
  count: number,
  style: { icon: StatusSummaryItem["icon"]; tint: string; barColor: string; label: string },
): StatusSummaryItem {
  return { key, count, label: t(style.label), icon: style.icon, barColor: style.barColor, iconColor: style.tint };
}

interface HintProps {
  text: string;
}

function Hint({ text }: HintProps) {
  return (
    <Text fontSize={13} fontWeight="$secondary" lineHeight={19} color="$neutralMuted">
      {text}
    </Text>
  );
}

interface ContactLineProps {
  icon: typeof Mail;
  text: string;
  onPress: () => void;
}

function ContactLine({ icon: Icon, text, onPress }: ContactLineProps) {
  return (
    <XStack role="link" aria-label={text} onPress={onPress} pressStyle={{ opacity: 0.8 }} alignItems="center" gap={10}>
      <Icon size={16} color={neutral.muted} strokeWidth={2} />
      <Text flex={1} fontSize={14} fontWeight="600" color="$neutralText" numberOfLines={1}>
        {text}
      </Text>
    </XStack>
  );
}
