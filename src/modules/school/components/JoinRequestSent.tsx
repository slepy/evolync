import {
  AuthPage,
  ListCard,
  ListIcon,
  ListRow,
  PrimaryButton,
  StatusBadge,
  StatusHero,
} from "@/core/components";
import type School from "@/database/models/School";
import { Building2, Clock } from "lucide-react-native";
import { useEffect, useState } from "react";
import { YStack } from "tamagui";
import { SchoolRepository } from "../repositories";
import { SCHOOL_BUTTON } from "./schoolButton";

export interface JoinRequestSentProps {
  schoolId: string;
  onDone: () => void;
}

/** Request sent (JoinSchoolSent): Pending hero, the school row with its Pending badge, Done. */
export function JoinRequestSent({ schoolId, onDone }: JoinRequestSentProps) {
  const [school, setSchool] = useState<School | null>(null);

  // The school usually belongs to another organization: fetched once when not synced yet.
  useEffect(() => {
    SchoolRepository.findByIdOrFetchFromSupabase(schoolId).then(setSchool).catch(console.error);
  }, [schoolId]);

  return (
    <AuthPage context="school" footer={<PrimaryButton label={t("joinSchoolDone")} colors={SCHOOL_BUTTON} onPress={onDone} />}>
      <YStack gap={26} paddingTop={130}>
        <StatusHero icon={Clock} color="warning" title={t("joinSchoolSentTitle")} text={t("joinSchoolSentHint")} />
        <ListCard aria-label={t("joinRequestsTitle")}>
          <ListRow
            title={school?.name ?? "…"}
            subtitle={school?.address || undefined}
            leading={<ListIcon icon={Building2} accent="school" size={44} />}
            trailing={<StatusBadge label={t("statusPending")} color="warning" />}
          />
        </ListCard>
      </YStack>
    </AuthPage>
  );
}
