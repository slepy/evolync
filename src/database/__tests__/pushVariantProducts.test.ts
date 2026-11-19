import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { database } from "@/database";
import { withVariantProducts } from "../pushVariantProducts";

async function seedProduct(id: string) {
  await database.write(async () => {
    await database.get("products").create((record) => {
      record._raw = {
        ...record._raw,
        id,
        organization_id: "org-1",
        name: "Belt",
        created_at: 1,
        updated_at: 1,
        deleted_at: null,
        _status: "synced",
        _changed: "",
      } as any;
    });
  });
}

const empty = () => ({ created: [], updated: [], deleted: [] });
const push = (changes: object) => withVariantProducts(changes as any);

describe("withVariantProducts", () => {
  beforeEach(async () => {
    await database.write(() => database.unsafeResetDatabase());
  });

  it("sends the synced product of a new variant as updated", async () => {
    await seedProduct("belt");

    const changes = await push({
      products: empty(),
      product_variants: { created: [{ id: "belt-m", product_id: "belt" } as any], updated: [], deleted: [] },
    });

    assert.deepEqual(changes.products.updated.map((p) => p.id), ["belt"]);
    assert.equal((changes.products.updated[0] as any)._status, undefined);
    assert.equal((changes.products.updated[0] as any).name, "Belt");
  });

  it("leaves a product already in the push and an unknown product alone", async () => {
    await seedProduct("belt");

    const changes = await push({
      products: { created: [{ id: "belt" } as any], updated: [], deleted: [] },
      product_variants: {
        created: [{ id: "belt-m", product_id: "belt" } as any, { id: "lost-m", product_id: "lost" } as any],
        updated: [],
        deleted: [],
      },
    });

    assert.deepEqual(changes.products.created.map((p) => p.id), ["belt"]);
    assert.deepEqual(changes.products.updated, []);
  });
});
