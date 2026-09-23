export type TaggableType = "note_document" | "threed_technique";

export interface TagDTO {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaggableDTO {
  id: string;
  tagId: string;
  taggableId: string;
  taggableType: TaggableType;
  createdAt: Date;
}

export interface CreateTagInput {
  userId: string;
  name: string;
  color: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
}

export interface AttachTagInput {
  tagId: string;
  taggableId: string;
  taggableType: TaggableType;
}
