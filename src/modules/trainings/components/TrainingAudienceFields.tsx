import { TRAINING_VISIBILITY, type TrainingVisibility } from "@/database/models/Training";
import { SelectableMemberCard } from "@/modules/students/components";
import React from "react";
import { Text, YStack } from "tamagui";
import { SimpleSelect } from "./SimpleSelect";

export interface AudienceMember {
  id: string;
  displayName: string;
  schoolName?: string;
}

interface TrainingAudienceFieldsProps {
  visibility: TrainingVisibility;
  schoolId?: string;
  inviteeIds: string[];
  onVisibilityChange: (visibility: TrainingVisibility) => void;
  onSchoolChange: (schoolId: string) => void;
  onInviteesChange: (ids: string[]) => void;
  schools: Array<{ id: string; name: string }>;
  members: AudienceMember[];
  errors?: { visibility?: string; schoolId?: string; inviteeIds?: string };
  disabled?: boolean;
}

/** Organization / school / selected people — the same choice as the event form. */
export const TrainingAudienceFields: React.FC<TrainingAudienceFieldsProps> = ({
  visibility,
  schoolId,
  inviteeIds,
  onVisibilityChange,
  onSchoolChange,
  onInviteesChange,
  schools,
  members,
  errors = {},
  disabled = false,
}) => (
  <YStack gap="$3">
    <SimpleSelect
      label={t("trainingsAudienceLabel")}
      value={visibility}
      onChange={(value) => onVisibilityChange(value as TrainingVisibility)}
      options={[
        { value: TRAINING_VISIBILITY.ORGANIZATION, label: t("eventsVisibilityOrganization") },
        { value: TRAINING_VISIBILITY.SCHOOL, label: t("eventsVisibilitySchool") },
        { value: TRAINING_VISIBILITY.WHITELIST, label: t("eventsVisibilityWhitelist") },
      ]}
      error={errors.visibility}
      disabled={disabled}
    />

    {visibility === TRAINING_VISIBILITY.SCHOOL && (
      <SimpleSelect
        label={t("eventsSchoolLabel")}
        value={schoolId}
        placeholder={t("eventsSchoolPlaceholder")}
        onChange={onSchoolChange}
        options={schools.map((s) => ({ value: s.id, label: s.name }))}
        error={errors.schoolId}
        disabled={disabled}
      />
    )}

    {visibility === TRAINING_VISIBILITY.WHITELIST && (
      <YStack gap="$2">
        <Text fontSize="$3" color="$textSecondary" fontWeight="500">
          {t("eventsWhitelistLabel")}
        </Text>
        {members.length === 0 ? (
          <Text color="$textMuted" fontSize="$3">
            {t("emptyNoMembersAvailable")}
          </Text>
        ) : (
          members.map((member) => {
            const isSelected = inviteeIds.includes(member.id);
            return (
              <SelectableMemberCard
                key={member.id}
                member={member}
                isSelected={isSelected}
                disabled={disabled}
                onPress={() => {
                  if (disabled) return;
                  onInviteesChange(
                    isSelected ? inviteeIds.filter((id) => id !== member.id) : [...inviteeIds, member.id],
                  );
                }}
              />
            );
          })
        )}
        {errors.inviteeIds && (
          <Text color="$imperialRed" fontSize="$3">
            {errors.inviteeIds}
          </Text>
        )}
      </YStack>
    )}
  </YStack>
);
