import { ChoiceList, PrimaryButton, SubScreenPage } from "@/core/components";
import { moduleAccents } from "@/core/theme/tokens";
import React, { useMemo, useState } from "react";
import { Text, View, XStack, YStack } from "tamagui";
import { INVITE_VALIDITY_DAYS, inviteExpiry, type InviteValidityDays } from "../studentList";

interface InviteCreateScreenProps {
  /** Creates the code valid until `expiresAt`; a thrown error is shown above the button. */
  onSubmit: (expiresAt: number) => Promise<void>;
}

const STEPS = ["inviteStep1", "inviteStep2", "inviteStep3"] as const;

/**
 * New invite code (16D): "How it works" in three numbered steps, "Valid for"
 * 1 / 7 / 30 days with the expiry date under each, Create.
 */
export const InviteCreateScreen: React.FC<InviteCreateScreenProps> = ({ onSubmit }) => {
  const [days, setDays] = useState<InviteValidityDays>(7);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const now = useMemo(() => new Date(), []);
  const localeTag = t("locale") === "pl" ? "pl-PL" : "en-GB";
  const day = (date: Date) => date.toLocaleDateString(localeTag, { day: "numeric", month: "short" });

  const handleCreate = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setError(undefined);
    try {
      await onSubmit(inviteExpiry(new Date(), days).getTime());
    } catch (err) {
      setError(err instanceof Error ? err.message : t("inviteCreateError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SubScreenPage
      title={t("inviteCodeLabel")}
      context="school"
      footer={
        <YStack gap={10}>
          {error ? (
            <Text fontSize={12.5} fontWeight="$secondary" color="$trashText" textAlign="center">
              {error}
            </Text>
          ) : null}
          <PrimaryButton label={t("create")} accent="students" onPress={handleCreate} loading={isSaving} />
        </YStack>
      }
    >
      <YStack gap={12} padding={16} borderRadius="$card" borderWidth={1} borderColor="$neutralCardBorder" backgroundColor="$neutralCard">
        <Text fontSize={16} fontWeight="$rowTitle" color="$neutralText">
          {t("inviteHowItWorks")}
        </Text>
        {STEPS.map((step, index) => (
          <XStack key={step} alignItems="center" gap={12}>
            <View
              width={28}
              height={28}
              borderRadius={14}
              backgroundColor={moduleAccents.students.fill}
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Text fontSize={13} fontWeight="$button" color={moduleAccents.students.tint}>
                {index + 1}
              </Text>
            </View>
            <Text flex={1} fontSize={14} fontWeight="600" lineHeight={20} color="$neutralMuted">
              {t(step)}
            </Text>
          </XStack>
        ))}
      </YStack>

      <ChoiceList
        title={t("inviteValidFor")}
        accent="students"
        value={String(days)}
        onChange={(value) => setDays(Number(value) as InviteValidityDays)}
        options={INVITE_VALIDITY_DAYS.map((d) => {
          const expires = inviteExpiry(now, d);
          return {
            value: String(d),
            title: t("inviteValidDays", { count: d }),
            hint: d === 1 ? t("inviteExpiresTomorrow", { date: day(expires) }) : t("inviteExpiresAt", { date: day(expires) }),
          };
        })}
      />
    </SubScreenPage>
  );
};
