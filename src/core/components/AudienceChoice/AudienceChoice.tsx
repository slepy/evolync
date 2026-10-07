import { School } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView } from "react-native";
import { Text, YStack } from "tamagui";
import { ChoiceList } from "../ChoiceList";
import { FormSheet } from "../FormSheet";
import { ListCard, ListCheck, ListCheckbox, ListIcon, ListRow, ListSection } from "../List";
import { MemberAvatar } from "../MemberAvatar";
import type { ListAccent } from "../List/accent";

/** Who an event or a training is for (same values as their `visibility`). */
export const AUDIENCE = {
  ORGANIZATION: "organization",
  SCHOOL: "school",
  WHITELIST: "whitelist",
} as const;

export type Audience = (typeof AUDIENCE)[keyof typeof AUDIENCE];

export interface AudienceMember {
  id: string;
  displayName: string;
  schoolName?: string;
  /** Profile photo shown instead of the initials. */
  avatarUrl?: string;
  /** Current rank: its belt color cuts the avatar corner. */
  rankId?: string;
}

export interface AudienceChoiceProps<T extends Audience> {
  /** "Who is it for?" (trainings) / "Who can see it?" (events). */
  title: string;
  accent: ListAccent;
  visibility: T;
  schoolId?: string;
  inviteeIds: string[];
  onVisibilityChange: (value: T) => void;
  onSchoolChange: (schoolId: string) => void;
  onInviteesChange: (ids: string[]) => void;
  schools: Array<{ id: string; name: string }>;
  members: AudienceMember[];
  errors?: { visibility?: string; schoolId?: string; inviteeIds?: string };
  disabled?: boolean;
}

/**
 * Audience choice (10A / 11A): entire organization, one school (picked in
 * a sheet, its name shown as the hint; tapping it again changes the school)
 * or selected members (SELECT MEMBERS checkbox list under the choice, 10B).
 */
export function AudienceChoice<T extends Audience>({
  title,
  accent,
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
}: AudienceChoiceProps<T>) {
  const [schoolSheetOpen, setSchoolSheetOpen] = useState(false);
  const schoolName = schools.find((s) => s.id === schoolId)?.name;

  const choose = (value: T) => {
    if (value === AUDIENCE.SCHOOL) {
      if (schools.length === 1) onSchoolChange(schools[0].id);
      else if (schools.length > 1) setSchoolSheetOpen(true);
    }
    onVisibilityChange(value);
  };

  const toggleMember = (id: string) =>
    onInviteesChange(inviteeIds.includes(id) ? inviteeIds.filter((m) => m !== id) : [...inviteeIds, id]);

  return (
    <YStack gap={16}>
      <ChoiceList<T>
        title={title}
        accent={accent}
        value={visibility}
        onChange={choose}
        disabled={disabled}
        error={errors?.visibility ?? (visibility === AUDIENCE.SCHOOL ? errors?.schoolId : undefined)}
        options={[
          {
            value: AUDIENCE.ORGANIZATION as T,
            title: t("audienceEntireOrganization"),
            hint: t("audienceOrganizationHint"),
          },
          {
            value: AUDIENCE.SCHOOL as T,
            title: t("audienceSchool"),
            hint: (visibility === AUDIENCE.SCHOOL && schoolName) || t("audienceSchoolHint"),
          },
          {
            value: AUDIENCE.WHITELIST as T,
            title: t("audienceSelected"),
            hint: t("audienceSelectedHint"),
          },
        ]}
      />

      {visibility === AUDIENCE.WHITELIST ? (
        <ListSection
          variant="label"
          title={t("audienceSelectMembers")}
          accent={accent}
          chip={inviteeIds.length > 0 ? t("selectedCount", { count: inviteeIds.length }) : undefined}
        >
          {members.length === 0 ? (
            <Text fontSize={13} fontWeight="$secondary" color="$neutralMuted">
              {t("emptyNoMembersAvailable")}
            </Text>
          ) : (
            <ListCard role="group" aria-label={t("audienceSelectMembers")}>
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
                    leading={<MemberAvatar name={member.displayName} uri={member.avatarUrl} rankId={member.rankId} />}
                    trailing={<ListCheckbox checked={checked} accent={accent} />}
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

      <FormSheet open={schoolSheetOpen} onOpenChange={setSchoolSheetOpen} title={t("audienceSelectSchool")}>
        <ScrollView style={{ maxHeight: 420 }}>
          <ListCard role="radiogroup" aria-label={t("audienceSelectSchool")}>
            {schools.map((school) => (
              <ListRow
                key={school.id}
                size="md"
                role="radio"
                aria-checked={school.id === schoolId}
                title={school.name}
                selected={school.id === schoolId}
                accent={accent}
                leading={<ListIcon icon={School} accent="school" size={44} />}
                trailing={school.id === schoolId ? <ListCheck accent={accent} /> : undefined}
                onPress={() => {
                  onSchoolChange(school.id);
                  onVisibilityChange(AUDIENCE.SCHOOL as T);
                  setSchoolSheetOpen(false);
                }}
              />
            ))}
          </ListCard>
        </ScrollView>
      </FormSheet>
    </YStack>
  );
}
