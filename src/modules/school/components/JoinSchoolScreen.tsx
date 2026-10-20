import {
  AlertBanner,
  AuthIntro,
  IntroIcon,
  Notice,
  PrimaryButton,
  StepList,
  SubScreenPage,
  TextField,
} from "@/core/components";
import { useStore } from "@/store";
import { Ticket } from "lucide-react-native";
import React, { useState } from "react";
import { YStack } from "tamagui";
import { useJoinSchool } from "../hooks";
import { joinSchoolErrorText } from "./joinSchoolError";
import { SCHOOL_BUTTON } from "./schoolButton";
import { JoinRequestSent } from "./JoinRequestSent";
import type { JoinSchoolUser } from "../types";

interface JoinSchoolScreenProps {
  user: JoinSchoolUser | null;
  /** Back chevron; after sign-up the route sends it to the dashboard. */
  onBack: () => void;
  /** Done on Request sent. */
  onDone: () => void;
}

/**
 * Join a school (JoinSchool boards): the school code, an alert when it does
 * not work, a notice and a disabled Join while offline; then Request sent
 * with the school waiting for the instructor's approval.
 */
export const JoinSchoolScreen: React.FC<JoinSchoolScreenProps> = ({ user, onBack, onDone }) => {
  const online = useStore((s) => s.sync.isOnline);
  const { joinSchool, isLoading, error, reset } = useJoinSchool();
  const [code, setCode] = useState("");
  const [sentSchoolId, setSentSchoolId] = useState<string | null>(null);

  const trimmed = code.trim();
  const canJoin = !!trimmed && online && !!user;

  const handleJoin = async () => {
    if (!canJoin || !user) return;
    const schoolId = await joinSchool(trimmed.toUpperCase(), user.id, user.email, user.displayName, user.avatarUrl);
    if (schoolId) setSentSchoolId(schoolId);
  };

  if (sentSchoolId) return <JoinRequestSent schoolId={sentSchoolId} onDone={onDone} />;

  const errorText = joinSchoolErrorText(error);

  return (
    <SubScreenPage
      title={t("noSchoolJoin")}
      onBack={onBack}
      context="school"
      footer={
        <PrimaryButton
          label={t("joinSchoolJoin")}
          colors={SCHOOL_BUTTON}
          onPress={handleJoin}
          disabled={!canJoin}
          loading={isLoading}
        />
      }
    >
      <YStack gap={22}>
        {!online ? <Notice text={t("joinSchoolOffline")} /> : null}
        <AuthIntro
          centered
          icon={<IntroIcon icon={Ticket} accent="school" />}
          title={t("enterSchoolCode")}
          description={t("enterSchoolCodeDescription")}
        />
        {errorText ? (
          <AlertBanner title={t(errorText.title)} message={t(errorText.message)} onDismiss={reset} />
        ) : null}
        <TextField
          label={t("schoolCode")}
          value={code}
          onChangeText={(value) => {
            setCode(value);
            if (error) reset();
          }}
          placeholder={t("schoolCodePlaceholder")}
          size="large"
          accent="school"
          invalid={!!error}
          autoFocus
          autoCapitalize="characters"
          autoComplete="off"
          returnKeyType="send"
          onSubmitEditing={handleJoin}
        />
        <StepList
          title={t("inviteHowItWorks")}
          accent="school"
          steps={[t("joinSchoolStep1"), t("joinSchoolStep2"), t("joinSchoolStep3")]}
        />
      </YStack>
    </SubScreenPage>
  );
};
