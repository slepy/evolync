import {
  ChoiceList,
  FormSheet,
  ListAvatar,
  ListCard,
  ListCheck,
  ListCheckbox,
  ListIcon,
  ListRow,
  ListSection,
} from "@/core/components";
import { TRAINING_VISIBILITY, type TrainingVisibility } from "@/database/models/Training";
import { School } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView } from "react-native";
import { Text, YStack } from "tamagui";
import { memberInitials } from "./format";

export interface AudienceMember {
  id: string;
  displayName: string;
  schoolName?: string;
}

interface TrainingAudienceChoiceProps {
  visibility: TrainingVisibility;
  schoolId?: string;
  inviteeIds: string[];
  onVisibilityChange: (value: TrainingVisibility) => void;
  onSchoolChange: (schoolId: string) => void;
  onInviteesChange: (ids: string[]) => void;
  schools: Array<{ id: string; name: string }>;
  members: AudienceMember[];
  errors?: { visibility?: string; schoolId?: string; inviteeIds?: string };
  disabled?: boolean;
}

/**
 * "Who is it for?" (11A / 11B): entire organization, one school (picked in
 * a sheet, its name shown as the hint; tapping it again changes the school)
 * or selected members (checkbox list under the choice).
 */
export const TrainingAudienceChoice: React.FC<TrainingAudienceChoiceProps> = ({
  visibility,
  schoolId,
  inviteeIds,
  onVisibilityChange,
  onSchoolChange,
  onInviteesChange,
  schools,
  members,
  errors,
  disabled,
}) => {
  const [schoolSheetOpen, setSchoolSheetOpen] = useState(false);
  const schoolName = schools.find((s) => s.id === schoolId)?.name;

  const choose = (value: TrainingVisibility) => {
    if (value === TRAINING_VISIBILITY.SCHOOL) {
      if (schools.length === 1) onSchoolChange(schools[0].id);
      else if (schools.length > 1) setSchoolSheetOpen(true);
    }
    onVisibilityChange(value);
  };

  const toggleMember = (id: string) =>
    onInviteesChange(inviteeIds.includes(id) ? inviteeIds.filter((m) => m !== id) : [...inviteeIds, id]);

  return (
    <YStack gap={16}>
      <ChoiceList
        title={t("trainingsAudienceTitle")}
        accent="trainings"
        value={visibility}
        onChange={choose}
        disabled={disabled}
        error={errors?.visibility ?? (visibility === TRAINING_VISIBILITY.SCHOOL ? errors?.schoolId : undefined)}
        options={[
          {
            value: TRAINING_VISIBILITY.ORGANIZATION,
            title: t("trainingsAudienceEntireOrganization"),
            hint: t("trainingsAudienceOrganizationHint"),
          },
          {
            value: TRAINING_VISIBILITY.SCHOOL,
            title: t("trainingsAudienceSchool"),
            hint: (visibility === TRAINING_VISIBILITY.SCHOOL && schoolName) || t("trainingsAudienceSchoolHint"),
          },
          {
            value: TRAINING_VISIBILITY.WHITELIST,
            title: t("trainingsAudienceSelected"),
            hint: t("trainingsAudienceSelectedHint"),
          },
        ]}
      />

      {visibility === TRAINING_VISIBILITY.WHITELIST ? (
        <ListSection
          variant="label"
          title={t("trainingsSelectMembers")}
          accent="trainings"
          chip={inviteeIds.length > 0 ? t("selectedCount", { count: inviteeIds.length }) : undefined}
        >
          {members.length === 0 ? (
            <Text fontSize={13} fontWeight="$secondary" color="$neutralMuted">
              {t("emptyNoMembersAvailable")}
            </Text>
          ) : (
            <ListCard role="group" aria-label={t("trainingsSelectMembers")}>
              {members.map((member) => {
                const checked = inviteeIds.includes(member.id);
                return (
                  <ListRow
                    key={member.id}
                    size="md"
                    role="checkbox"
                    aria-checked={checked}
                    title={member.displayName}
                    subtitle={member.schoolName}
                    leading={<ListAvatar initials={memberInitials(member.displayName)} />}
                    trailing={<ListCheckbox checked={checked} accent="trainings" />}
                    onPress={disabled ? undefined : () => toggleMember(member.id)}
                  />
                );
              })}
            </ListCard>
          )}
          {errors?.inviteeIds ? (
            <Text fontSize={12.5} fontWeight="$secondary" color="$trashText">
              {errors.inviteeIds}
            </Text>
          ) : null}
        </ListSection>
      ) : null}

      <FormSheet open={schoolSheetOpen} onOpenChange={setSchoolSheetOpen} title={t("eventsSchoolPlaceholder")}>
        <ScrollView style={{ maxHeight: 420 }}>
          <ListCard role="radiogroup" aria-label={t("eventsSchoolPlaceholder")}>
            {schools.map((school) => (
              <ListRow
                key={school.id}
                size="md"
                role="radio"
                aria-checked={school.id === schoolId}
                title={school.name}
                selected={school.id === schoolId}
                accent="trainings"
                leading={<ListIcon icon={School} accent="school" size={44} />}
                trailing={school.id === schoolId ? <ListCheck accent="trainings" /> : undefined}
                onPress={() => {
                  onSchoolChange(school.id);
                  onVisibilityChange(TRAINING_VISIBILITY.SCHOOL);
                  setSchoolSheetOpen(false);
                }}
              />
            ))}
          </ListCard>
        </ScrollView>
      </FormSheet>
    </YStack>
  );
};
