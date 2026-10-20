import { ChoiceList, FormSheet, PrimaryButton } from "@/core/components";
import React, { useEffect, useState } from "react";
import { Text, YStack } from "tamagui";
import { TRAINING_EDIT_SCOPE, type TrainingEditScope } from "../types/enums";
import { formatDay } from "./format";
import type { TrainingScopeAction } from "../types";

interface TrainingScopeSheetProps {
  /** Which action asks; null keeps the sheet closed. */
  action: TrainingScopeAction | null;
  onClose: () => void;
  name: string;
  /** The selected training's day ("YYYY-MM-DD"). */
  day: string;
  onContinue: (action: TrainingScopeAction, scope: TrainingEditScope) => void;
}

/**
 * "This training only / This and following" (11E), asked before editing or
 * deleting a training that belongs to a series. Delete still confirms after
 * Continue.
 */
export const TrainingScopeSheet: React.FC<TrainingScopeSheetProps> = ({ action, onClose, name, day, onContinue }) => {
  const [scope, setScope] = useState<TrainingEditScope>(TRAINING_EDIT_SCOPE.THIS);
  const shortDay = formatDay(day, { day: "numeric", month: "short" });

  useEffect(() => {
    if (action) setScope(TRAINING_EDIT_SCOPE.THIS);
  }, [action]);

  const remove = action === "delete";

  return (
    <FormSheet
      open={action !== null}
      onOpenChange={(open) => !open && onClose()}
      title={remove ? t("trainingsScopeDeleteTitle") : t("trainingsScopeEditTitle")}
      subtitle={t("trainingsScopeSubtitle", { name })}
      footer={
        <YStack gap={12}>
          <PrimaryButton
            label={t("continue")}
            accent="trainings"
            onPress={() => action && onContinue(action, scope)}
          />
          <Text fontSize={12.5} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
            {remove ? t("trainingsScopeDeleteNote") : t("trainingsScopeEditNote")}
          </Text>
        </YStack>
      }
    >
      <ChoiceList
        accent="trainings"
        value={scope}
        onChange={setScope}
        options={[
          {
            value: TRAINING_EDIT_SCOPE.THIS,
            title: t("trainingsScopeThis"),
            hint: formatDay(day),
          },
          {
            value: TRAINING_EDIT_SCOPE.FOLLOWING,
            title: t("trainingsScopeFollowing"),
            hint: t("trainingsScopeFollowingHint", { date: shortDay }),
          },
        ]}
      />
    </FormSheet>
  );
};
