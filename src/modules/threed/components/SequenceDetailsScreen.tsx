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
import { LoadingScreen } from "@/core/components";
import { confirmDelete } from "@/core/utils/confirmDelete";
import { useLocalSearchParams, useRouter } from "expo-router";
import { PenLine, Play } from "lucide-react-native";
import React, { useEffect } from "react";
import { Text, View, XStack, YStack } from "tamagui";
import { useSequenceDetails } from "../hooks";
import { deleteSequence, deleteStep } from "../services";

const lime = resolveListAccent("threed");

/**
 * Sequence (D6): title, description and tags, Edit / View pills, numbered
 * steps with delete. No model here: the figure renders only in the viewer
 * (View) and the editor (a step row opens it on that step).
 */
export function SequenceDetailsScreen() {
  const { sequenceId } = useLocalSearchParams<{ sequenceId: string }>();
  const router = useRouter();
  const { sequence, tags, steps, isLoading } = useSequenceDetails(sequenceId);

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
    confirmDelete(t("threedDeleteSequence"), t("threedDeleteSequenceConfirm"), () => {
      deleteSequence(sequence.id).catch((err) => console.error("[SequenceDetailsScreen] delete:", err));
    });

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
                  leading={<StepNumber n={index + 1} />}
                  trailing={
                    <TrashButton
                      size={40}
                      label={t("threedDeleteStepNumber", { n: index + 1 })}
                      onPress={() =>
                        confirmDelete(t("delete"), t("threedDeleteStepConfirm"), () => {
                          deleteStep(step.id).catch((err) => console.error("[SequenceDetailsScreen] delete step:", err));
                        })
                      }
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

/** 44px numbered square of a step row in the lime fill. */
function StepNumber({ n }: { n: number }) {
  return (
    <View width={44} height={44} borderRadius={14} backgroundColor={lime.fill} alignItems="center" justifyContent="center">
      <Text fontSize={16} fontWeight="$button" color={lime.tint}>
        {n}
      </Text>
    </View>
  );
}
