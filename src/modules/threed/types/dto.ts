import type { BodyPart } from "./ik";
import type { AnyStepData, AnyTechniqueData } from "./data";

export interface CreateSequenceDto {
  title: string;
  description?: string;
  tagIds?: string[];
}

export interface UpdateSequenceDto {
  title?: string;
  description?: string;
  tagIds?: string[];
}

export interface CreateTechniqueDto {
  title: string;
  description?: string;
  bodyPart: BodyPart | string;
  techniqueData: AnyTechniqueData;
}

export interface UpdateTechniqueDto {
  title?: string;
  description?: string;
  data?: string;
}

export interface AddStepDto {
  sequenceId: string;
  orderIndex: number;
  durationMs?: number;
  stepData: AnyStepData;
}
