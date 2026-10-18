import {
  ActionPill,
  ListCard,
  ListEmpty,
  ListRow,
  ListSection,
  resolveListAccent,
  SubScreenPage,
  TagChip,
  TrashButton,
} from "@/core/components";
import { threedScene } from "@/core/theme/tokens";
import { LoadingScreen } from "@/modules/core/components";
import { confirmDelete } from "@/modules/core/utils/confirmDelete";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { PenLine, Play } from "lucide-react-native";
import React, { useEffect, useMemo } from "react";
import { Text, View, XStack, YStack } from "tamagui";
import { useSequenceDetails } from "../hooks";
import { deleteSequence, deleteStep } from "../services";
import { stepBoneTransforms } from "../utils/dataCompat";
import { PosePreview } from "./PosePreview";

const lime = resolveListAccent("threed");

/**
 * Sequence (D6): title, description and tags, the first step on the real
 * model with Step 1 of N and View, Edit / View pills, numbered steps with
 * delete. A step row opens the editor on that step.
 */
export function SequenceDetailsScreen() {
  const { sequenceId } = useLocalSearchParams<{ sequenceId: string }>();
  const router = useRouter();
  const { sequence, tags, steps, isLoading } = useSequenceDetails(sequenceId);
  const firstPose = useMemo(() => stepBoneTransforms(steps[0]?.data), [steps]);

  // Deleted here or on another device: back to the library.
  useEffect(() => {
    if (!isLoading && !sequence) router.back();
  }, [isLoading, sequence, router]);

  if (isLoading || !sequence) return <LoadingScreen />;

  const openEditor = (step?: number) =>
    router.push(`/techniques/threed/${sequence.id}/edit${step === undefined ? "" : `?step=${step}`}` as any);
  const openViewer = () => router.push(`/techniques/threed/${sequence.id}/viewer` as any);
  const hasSteps = steps.length > 0;

  const handleDelete = () =>
    // The effect above leaves the screen once the sequence is gone.
    confirmDelete(t("threedDeleteSequence"), t("threedDeleteSequenceConfirm"), () => deleteSequence(sequence.id));

  return (
    <SubScreenPage
      title={t("threedSequence")}
      right={<TrashButton label={t("threedDeleteSequence")} onPress={handleDelete} />}
    >
      <YStack gap={20}>
        <YStack gap={8}>
          <Text fontSize={26} lineHeight={30} fontWeight="$section" letterSpacing={-0.5} color="$neutralText">
            {sequence.title}
          </Text>
          {sequence.description ? (
            <Text fontSize={14} lineHeight={20} fontWeight="$secondary" color="$neutralMuted">
              {sequence.description}
            </Text>
          ) : null}
          {tags.length > 0 ? (
            <XStack flexWrap="wrap" gap={6} marginTop={4}>
              {tags.map((tag) => (
                <TagChip key={tag.id} label={tag.name} />
              ))}
            </XStack>
          ) : null}
        </YStack>

        <PosePreview boneTransforms={firstPose}>
          {hasSteps ? (
            <XStack
              position="absolute"
              left={14}
              top={14}
              height={30}
              paddingHorizontal={12}
              borderRadius={15}
              alignItems="center"
              backgroundColor={threedScene.scrim}
            >
              <Text fontSize={12} fontWeight="$button" color={lime.tint}>
                {t("threedStepOf", { n: 1, total: steps.length })}
              </Text>
            </XStack>
          ) : null}
          {hasSteps ? (
            <View
              role="button"
              aria-label={t("view")}
              onPress={openViewer}
              pressStyle={{ opacity: 0.85 }}
              position="absolute"
              right={14}
              bottom={14}
              width={52}
              height={52}
              borderRadius={26}
              overflow="hidden"
            >
              <LinearGradient
                colors={[lime.from, lime.to]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
              >
                <Play size={22} color={lime.onGradient} fill={lime.onGradient} strokeWidth={2.2} />
              </LinearGradient>
            </View>
          ) : null}
        </PosePreview>

        <XStack gap={10}>
          <ActionPill label={t("edit")} icon={PenLine} tint={lime.tint} fill={lime.fill} onPress={() => openEditor()} />
          <ActionPill label={t("view")} icon={Play} tint={lime.tint} fill={lime.fill} disabled={!hasSteps} onPress={openViewer} />
        </XStack>

        <ListSection title={t("threedSteps")} accent="threed" chip={String(steps.length)}>
          {hasSteps ? (
            <ListCard aria-label={t("threedSteps")}>
              {steps.map((step, index) => (
                <ListRow
                  key={step.id}
                  title={t("threedStepNumber", { n: index + 1 })}
                  leading={<StepNumber n={index + 1} current={index === 0} />}
                  trailing={
                    <TrashButton
                      size={40}
                      label={t("threedDeleteStepNumber", { n: index + 1 })}
                      onPress={() => confirmDelete(t("delete"), t("threedDeleteStepConfirm"), () => deleteStep(step.id))}
                    />
                  }
                  onPress={() => openEditor(index)}
                />
              ))}
            </ListCard>
          ) : (
            <ListEmpty text={t("threedNoSteps")} hint={t("threedNoStepsHint")} />
          )}
        </ListSection>
      </YStack>
    </SubScreenPage>
  );
}

/** 44px numbered square of a step row; the first step (the one in the preview) in the lime gradient. */
function StepNumber({ n, current }: { n: number; current: boolean }) {
  const label = (
    <Text fontSize={16} fontWeight="$button" color={current ? lime.onGradient : lime.tint}>
      {n}
    </Text>
  );
  if (!current) {
    return (
      <View width={44} height={44} borderRadius={14} backgroundColor={lime.fill} alignItems="center" justifyContent="center">
        {label}
      </View>
    );
  }
  return (
    <LinearGradient
      colors={[lime.from, lime.to]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" }}
    >
      {label}
    </LinearGradient>
  );
}
