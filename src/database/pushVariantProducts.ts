import { Q } from "@nozbe/watermelondb";
import type { SyncDatabaseChangeSet } from "@nozbe/watermelondb/sync";
import { database } from "./index";

type ChangeSet = Record<string, { created: any[]; updated: any[]; deleted: string[] }>;

/**
 * Pushed variants carry the products they belong to. A product the device
 * holds as synced is not pushed by itself, so when the server lacks it (a row
 * that never reached it) a new variant failed its foreign key on every sync
 * and blocked the whole push. Sent as updated, a product the server lacks is
 * inserted before its variants (sync-organization.ts).
 */
export async function withVariantProducts(changeSet: SyncDatabaseChangeSet): Promise<ChangeSet> {
  const changes = changeSet as unknown as ChangeSet;
  const variants = changes.product_variants;
  if (!variants) return changes;

  const products = changes.products ?? { created: [], updated: [], deleted: [] };
  const pushed = new Set([...products.created, ...products.updated].map((p) => p.id));
  const parentIds = [
    ...new Set([...variants.created, ...variants.updated].map((v) => v.product_id as string)),
  ].filter((id) => id && !pushed.has(id));
  if (parentIds.length === 0) return changes;

  const parents = await database.get("products").query(Q.where("id", Q.oneOf(parentIds))).fetch();
  if (parents.length === 0) return changes;

  const raws = parents.map((p) => {
    const { _status: _s, _changed: _c, ...raw } = p._raw as any;
    return raw;
  });
  return { ...changes, products: { ...products, updated: [...products.updated, ...raws] } };
}
