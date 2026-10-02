import { sync } from "@/database/sync";
import { useStore } from "@/store";
import type Technique from "@/database/models/Technique";
import { TechniqueRepository } from "../repositories";
import type { BodyPart, CreateTechniqueDto, UpdateTechniqueDto } from "../types";
import { createTechniqueSchema, updateTechniqueSchema } from "../validation";

export const saveTechnique = async (
  data: CreateTechniqueDto
): Promise<Technique> => {
  const { user } = useStore.getState();
  if (!user) throw new Error("threedErrorNoUser");

  const parsed = createTechniqueSchema.parse(data);

  const technique = await TechniqueRepository.create({
    userId: user.id,
    title: parsed.title,
    description: parsed.description,
    // createTechniqueSchema only accepts BODY_PART values
    bodyPart: parsed.bodyPart as BodyPart,
    data: JSON.stringify(parsed.techniqueData),
  });

  sync().catch(console.error);
  return technique;
};

export const updateTechnique = async (
  techniqueId: string,
  data: UpdateTechniqueDto
): Promise<Technique> => {
  const parsed = updateTechniqueSchema.parse(data);
  const technique = await TechniqueRepository.update(techniqueId, parsed);
  sync().catch(console.error);
  return technique;
};
