export interface EntityTag {
  id: string;
  name: string;
}

/**
 * Joins taggable links with the user's tags, per tagged record (note, 3D
 * sequence). Links to missing (deleted) tags are skipped; tags keep the tag
 * list order.
 */
export function tagsByEntity<T extends EntityTag>(
  links: Array<{ taggableId: string; tagId: string }>,
  tags: T[],
): Map<string, T[]> {
  const order = new Map(tags.map((tag, index) => [tag.id, index]));
  const byId = new Map(tags.map((tag) => [tag.id, tag]));
  const result = new Map<string, T[]>();
  for (const link of links) {
    const tag = byId.get(link.tagId);
    if (!tag) continue;
    const list = result.get(link.taggableId) ?? [];
    if (!list.some((t) => t.id === tag.id)) list.push(tag);
    result.set(link.taggableId, list);
  }
  for (const list of result.values()) list.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
  return result;
}
