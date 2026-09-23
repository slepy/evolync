export type AttackDirection = "right" | "left";

export interface NoteDocumentDTO {
  id: string;
  userId: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteRowDTO {
  id: string;
  documentId: string;
  orderIndex: number;
  person1Text: string;
  person2Text: string;
  direction: AttackDirection;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteDocumentInput {
  userId: string;
  title: string;
  description?: string;
}

export interface UpdateNoteDocumentInput {
  title?: string;
  description?: string;
}

export interface CreateNoteRowInput {
  documentId: string;
  orderIndex: number;
  person1Text?: string;
  person2Text?: string;
  direction?: AttackDirection;
}

export interface UpdateNoteRowInput {
  person1Text?: string;
  person2Text?: string;
  direction?: AttackDirection;
  orderIndex?: number;
}
