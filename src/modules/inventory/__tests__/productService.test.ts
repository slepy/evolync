import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { database } from "@/database";
import type Product from "@/database/models/Product";
import type ProductVariant from "@/database/models/ProductVariant";

// Network / native modules the service imports, replaced before it is required.
const stub = (request: string, exports: unknown) => {
  const resolved = require.resolve(request);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports } as any;
};
stub("@/database/sync", { sync: async () => ({ success: true, timestamp: Date.now() }) });
stub("@/config/supabase", { supabase: {} });
stub("@/modules/core/utils/uploadImage", { uploadImage: async (uri: string) => uri });

const service = require("../services/productService") as typeof import("../services/productService");

const PHOTO = "https://cdn.example.com/product-images/gi.jpg";

const seedProduct = () =>
  database.write(async () => {
    const product = await database.get<Product>("products").create((p) => {
      p._raw.id = "p1";
      p.organizationId = "org-1";
      p.name = "Gi";
      p.description = "Cotton, white";
      p.imageUrl = PHOTO;
    });
    await database.get<ProductVariant>("product_variants").create((v) => {
      v._raw.id = "v1";
      v.productId = "p1";
      v.name = "Standard";
      v.price = 249.5;
      v.currency = "PLN";
      v.stockQuantity = 3;
    });
    return product;
  });

const variants = [{ id: "v1", name: "Standard", price: 249.5, currency: "PLN", stockQuantity: 3 }];

describe("updateProductWithVariants", () => {
  beforeEach(async () => {
    await database.write(() => database.unsafeResetDatabase());
    await seedProduct();
  });

  it("clears the description and removes the photo when they are null", async () => {
    const result = await service.updateProductWithVariants("p1", {
      name: "Gi",
      description: null,
      imageUri: null,
      variants,
    });
    assert.equal(result.description, null);
    assert.equal(result.imageUrl, null);
    const saved = await database.get<Product>("products").find("p1");
    assert.equal(saved.description ?? null, null);
    assert.equal(saved.imageUrl ?? null, null);
  });

  it("keeps the description and the remote photo when they are unchanged or omitted", async () => {
    await service.updateProductWithVariants("p1", { name: "Gi", imageUri: PHOTO, variants });
    const saved = await database.get<Product>("products").find("p1");
    assert.equal(saved.description, "Cotton, white");
    assert.equal(saved.imageUrl, PHOTO);
  });
});
