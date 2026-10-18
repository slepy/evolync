import { ListChip, TagChip, TrashButton } from "@/core/components";
import { LoadingScreen } from "@/core/components";
import { confirmDelete } from "@/core/utils/confirmDelete";
import { useEntityTags } from "@/modules/tags";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Text, XStack } from "tamagui";
import { useTechniqueById } from "../hooks";
import { bodyPartLabelKey, formatThreeDDate } from "../library";
import { deleteTechnique } from "../services";
import { BODY_PART } from "../types";
import type { BoneTransformMap } from "../types/fk";
import { normalizeTechniqueData } from "../utils/dataCompat";
import { HumanModel } from "./HumanModel";
import { SceneScreen } from "./SceneScreen";
import { ThreeDCanvas } from "./ThreeDCanvas";

/**
 * Technique or starting position (D7): the pose on the real model, then a
 * panel with the name, the body-part chip, when it was saved and its tags.
 */
export function TechniquePreviewScreen() {
  const { techniqueId } = useLocalSearchParams<{ techniqueId: string }>();
  const router = useRouter();
  const { technique, isLoading } = useTechniqueById(techniqueId!);
  const { tags } = useEntityTags(techniqueId, "threed_technique");

  const boneTransforms = useMemo<BoneTransformMap>(() => {
    if (!technique) return {};
    try {
      return normalizeTechniqueData(technique.techniqueData).boneTransforms ?? {};
    } catch (err) {
      console.error("[TechniquePreviewScreen] parse:", err);
      return {};
    }
  }, [technique]);

  if (isLoading) return <LoadingScreen />;

  const isPosition = technique?.bodyPart === BODY_PART.FULLBODY;
  const handleDelete = () =>
    technique &&
    confirmDelete(
      t(isPosition ? "threedDeletePosition" : "threedDeleteTechnique"),
      t(isPosition ? "threedDeletePositionConfirm" : "threedDeleteTechniqueConfirm"),
      async () => {
        await deleteTechnique(technique.id);
        router.back();
      },
    );

  return (
    <SceneScreen
      header={{
        title: t(isPosition ? "threedPosition" : "threedTechnique"),
        right: technique ? (
          <TrashButton label={t(isPosition ? "threedDeletePosition" : "threedDeleteTechnique")} onPress={handleDelete} />
        ) : (
          false
        ),
      }}
      scene={
        <ThreeDCanvas>
          <HumanModel modelSlot={0} boneTransforms={boneTransforms} />
        </ThreeDCanvas>
      }
      panelGap={14}
      panel={
        technique ? (
          <>
            <XStack alignItems="center" gap={10}>
              <Text flex={1} fontSize={24} fontWeight="$section" letterSpacing={-0.4} color="$neutralText" numberOfLines={2}>
                {technique.title}
              </Text>
              <ListChip label={t(bodyPartLabelKey(technique.bodyPart))} accent="threed" />
            </XStack>
            <Text fontSize={14} fontWeight="$secondary" color="$neutralMuted">
              {t("threedSavedOn", { date: formatThreeDDate(technique.createdAt, t("locale")) })}
            </Text>
            {tags.length > 0 ? (
              <XStack flexWrap="wrap" gap={6}>
                {tags.map((tag) => (
                  <TagChip key={tag.id} label={tag.name} />
                ))}
              </XStack>
            ) : null}
          </>
        ) : (
          <Text fontSize={14} fontWeight="$secondary" color="$neutralMuted">
            {t("threedTechniqueMissing")}
          </Text>
        )
      }
    />
  );
}
