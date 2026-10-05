import type Training from "@/database/models/Training";
import { TRAINING_VISIBILITY } from "@/database/models/Training";

/** Audience label: organization, the school's name, or selected people. */
export const audienceLabel = (training: Pick<Training, "visibility">, schoolName?: string): string => {
  if (training.visibility === TRAINING_VISIBILITY.SCHOOL) return schoolName ?? t("trainingsSchoolRemoved");
  if (training.visibility === TRAINING_VISIBILITY.WHITELIST) return t("trainingsAudiencePeople");
  return t("trainingsAudienceOrganization");
};
