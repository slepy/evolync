import { sync } from "@/database/sync";
import { TagRepository, TaggableRepository } from "../repositories";
import type { AttachTagInput, CreateTagInput, TaggableType, UpdateTagInput } from "../types";
import { isTagNameTaken, tagSchema } from "../validation/tagSchema";

/** Trimmed, valid and unique name; throws the translation key of the problem. */
const checkedName = async (userId: string, name: string, exceptId?: string): Promise<string> => {
  const parsed = tagSchema.safeParse({ name });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "tagsValidationNameRequired");
  const tags = await TagRepository.findByUserId(userId);
  if (isTagNameTaken(parsed.data.name, tags, exceptId)) throw new Error("tagsValidationNameTaken");
  return parsed.data.name;
};

export const createTag = async (data: CreateTagInput) => {
  const name = await checkedName(data.userId, data.name);
  const tag = await TagRepository.create({ ...data, name });
  sync().catch((err) => console.error("[createTag] Sync:", err));
  return tag;
};

export const updateTag = async (id: string, data: UpdateTagInput) => {
  if (data.name !== undefined) {
    const current = await TagRepository.findById(id);
    if (!current || current.deletedAt) throw new Error("errorUnknown");
    data = { ...data, name: await checkedName(current.userId, data.name, id) };
  }
  const tag = await TagRepository.update(id, data);
  sync().catch((err) => console.error("[updateTag] Sync:", err));
  return tag;
};

export const deleteTag = async (id: string) => {
  await TagRepository.softDelete(id);
  sync().catch((err) => console.error("[deleteTag] Sync:", err));
};

export const attachTag = async (data: AttachTagInput) => {
  const taggable = await TaggableRepository.attach(data);
  sync().catch((err) => console.error("[attachTag] Sync:", err));
  return taggable;
};

export const detachTag = async (tagId: string, taggableId: string) => {
  await TaggableRepository.detach(tagId, taggableId);
  sync().catch((err) => console.error("[detachTag] Sync:", err));
};

export const setTagsForEntity = async (
  tagIds: string[],
  taggableId: string,
  taggableType: TaggableType,
) => {
  const currentIds = await TaggableRepository.fetchTagIdsForEntity(taggableId, taggableType);

  const toAttach = tagIds.filter((id) => !currentIds.includes(id));
  const toDetach = currentIds.filter((id) => !tagIds.includes(id));

  await Promise.all([
    ...toAttach.map((tagId) => TaggableRepository.attach({ tagId, taggableId, taggableType })),
    ...toDetach.map((tagId) => TaggableRepository.detach(tagId, taggableId)),
  ]);

  sync().catch((err) => console.error("[setTagsForEntity] Sync:", err));
};
