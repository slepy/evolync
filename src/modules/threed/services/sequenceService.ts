import { sync } from "@/database/sync";
import { useStore } from "@/store";
import type Sequence from "@/database/models/Sequence";
import type SequenceStep from "@/database/models/SequenceStep";
import { uploadImage } from "@/modules/core/utils/uploadImage";
import { SequenceRepository, SequenceStepRepository } from "../repositories";
import type { CreateSequenceDto, UpdateSequenceDto, AnyStepData } from "../types";

export const createSequence = async (
  data: CreateSequenceDto
): Promise<Sequence> => {
  const { user } = useStore.getState();
  if (!user) throw new Error("threedErrorNoUser");

  const sequence = await SequenceRepository.create({
    userId: user.id,
    title: data.title,
    description: data.description,
  });

  sync().catch(console.error);
  return sequence;
};

export const updateSequence = async (
  sequenceId: string,
  data: UpdateSequenceDto
): Promise<Sequence> => {
  const sequence = await SequenceRepository.update(sequenceId, data);
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
  sync().catch(console.error);
};

export const addStepToSequence = async (
  sequenceId: string,
  stepData: AnyStepData,
  durationMs: number = 0
): Promise<SequenceStep> => {
  const orderIndex =
    await SequenceStepRepository.getNextOrderIndex(sequenceId);

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
