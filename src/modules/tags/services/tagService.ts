import { sync } from "@/database/sync";
import { TagRepository, TaggableRepository } from "../repositories";
import type { AttachTagInput, CreateTagInput, TaggableType, UpdateTagInput } from "../types";

export const createTag = async (data: CreateTagInput) => {
  const tag = await TagRepository.create(data);
  sync().catch((err) => console.error("[createTag] Sync:", err));
  return tag;
};

export const updateTag = async (id: string, data: UpdateTagInput) => {
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
