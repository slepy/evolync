import { sync } from "@/database/sync";
import { useStore } from "@/store";
import type Sequence from "@/database/models/Sequence";
import type SequenceStep from "@/database/models/SequenceStep";
import { uploadImage } from "@/core/utils/uploadImage";
import { TaggableRepository, setTagsForEntity } from "@/modules/tags";
import { SequenceRepository, SequenceStepRepository } from "../repositories";
import type { CreateSequenceDto, UpdateSequenceDto, AnyStepData } from "../types";
import { addStepSchema, createSequenceSchema, updateSequenceSchema, validated } from "../validation";

export const createSequence = async (
  data: CreateSequenceDto
): Promise<Sequence> => {
  const { user } = useStore.getState();
  if (!user) throw new Error("threedErrorNoUser");

  const parsed = validated(createSequenceSchema, data);

  const sequence = await SequenceRepository.create({
    userId: user.id,
    title: parsed.title,
    description: parsed.description,
  });
  if (data.tagIds?.length) await setTagsForEntity(data.tagIds, sequence.id, "threed_sequence");

  sync().catch(console.error);
  return sequence;
};

export const updateSequence = async (
  sequenceId: string,
  data: UpdateSequenceDto
): Promise<Sequence> => {
  const { tagIds, ...fields } = data;
  const parsed = validated(updateSequenceSchema, fields);
  const sequence = await SequenceRepository.update(sequenceId, parsed);
  if (tagIds) await setTagsForEntity(tagIds, sequenceId, "threed_sequence");
  sync().catch(console.error);
  return sequence;
};

export const updateSequenceCoverImage = async (
  sequenceId: string,
  screenshotUri: string
): Promise<Sequence> => {
  const { user } = useStore.getState();

  const imageUrl = await uploadImage(
    screenshotUri,
    "3d-sequences",
    user?.id
  );

  const sequence = await SequenceRepository.update(sequenceId, {
    coverImageUrl: imageUrl,
  });

  sync().catch(console.error);
  return sequence;
};

export const deleteSequence = async (sequenceId: string): Promise<void> => {
  await SequenceStepRepository.softDeleteBySequenceId(sequenceId);
  await SequenceRepository.softDelete(sequenceId);
  await TaggableRepository.detachAllFromEntity(sequenceId, "threed_sequence");
  sync().catch(console.error);
};

export const addStepToSequence = async (
  sequenceId: string,
  stepData: AnyStepData,
  durationMs: number = 0
): Promise<SequenceStep> => {
  const orderIndex =
    await SequenceStepRepository.getNextOrderIndex(sequenceId);

  validated(addStepSchema, { sequenceId, orderIndex, durationMs, stepData });

  const step = await SequenceStepRepository.create({
    sequenceId,
    orderIndex,
    durationMs,
    data: JSON.stringify(stepData),
  });

  sync().catch(console.error);
  return step;
};

export const updateStep = async (
  stepId: string,
  stepData: AnyStepData
): Promise<SequenceStep> => {
  const step = await SequenceStepRepository.update(stepId, {
    data: JSON.stringify(stepData),
  });

  sync().catch(console.error);
  return step;
};

export const deleteStep = async (stepId: string): Promise<void> => {
  await SequenceStepRepository.softDelete(stepId);
  sync().catch(console.error);
};
