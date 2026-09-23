import { sync } from "@/database/sync";
import { useStore } from "@/store";
import type Technique from "@/database/models/Technique";
import { TechniqueRepository } from "../repositories";
import type { CreateTechniqueDto, UpdateTechniqueDto } from "../types";

export const saveTechnique = async (
  data: CreateTechniqueDto
): Promise<Technique> => {
  const { user } = useStore.getState();
  if (!user) throw new Error("threedErrorNoUser");

  const technique = await TechniqueRepository.create({
    userId: user.id,
    title: data.title,
    description: data.description,
    bodyPart: data.bodyPart,
    data: JSON.stringify(data.techniqueData),
  });

  sync().catch(console.error);
  return technique;
};

export const updateTechnique = async (
  techniqueId: string,
  data: UpdateTechniqueDto
): Promise<Technique> => {
  const technique = await TechniqueRepository.update(techniqueId, data);
  sync().catch(console.error);
  return technique;
};

export const deleteTechnique = async (
  techniqueId: string
): Promise<void> => {
  await TechniqueRepository.softDelete(techniqueId);
  sync().catch(console.error);
};
