import { database } from "@/database";
import ProductVariant from "@/database/models/ProductVariant";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

export const ProductVariantRepository = {
  async create(data: Partial<ProductVariant>): Promise<ProductVariant> {
    const variantsCollection = database.get<ProductVariant>("product_variants");
    return await database.write(async () => {
      return await variantsCollection.create((record) => {
        record._raw.id = uuidv4();
        Object.assign(record, data);
      });
    });
  },

  async findById(id: string, includeDeleted = false): Promise<ProductVariant | null> {
    const variantsCollection = database.get<ProductVariant>("product_variants");
    try {
      const variant = await variantsCollection.find(id);
      if (!includeDeleted && variant.deletedAt) {
        return null;
      }
      return variant;
    } catch {
      return null;
    }
  },

  async findByProductId(productId: string): Promise<ProductVariant[]> {
    const variantsCollection = database.get<ProductVariant>("product_variants");
    return await variantsCollection
      .query(
        Q.where("product_id", productId),
        Q.where("deleted_at", null)
      )
      .fetch();
  },

  async update(
    id: string,
    data: Partial<ProductVariant>
  ): Promise<ProductVariant> {
    const variantsCollection = database.get<ProductVariant>("product_variants");
    const existing = await variantsCollection.find(id);
    return await database.write(async () => {
      return await existing.update((record) => {
        Object.assign(record, data);
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const variantsCollection = database.get<ProductVariant>("product_variants");
    const variant = await variantsCollection.find(id);
    await database.write(async () => {
      await variant.update((record) => {
        record.deletedAt = new Date();
      });
    });
  },

  async softDeleteByProductId(productId: string): Promise<void> {
    const variantsCollection = database.get<ProductVariant>("product_variants");
    const variants = await variantsCollection
      .query(Q.where("product_id", productId))
      .fetch();

    await database.write(async () => {
      const operations = variants.map((variant) =>
        variant.prepareUpdate((record) => {
          record.deletedAt = new Date();
        })
      );
      if (operations.length > 0) {
        await database.batch(operations);
      }
    });
  },

  // Observable methods for reactive UI
  observeByProductId(productId: string) {
    const variantsCollection = database.get<ProductVariant>("product_variants");
    return variantsCollection
      .query(
        Q.where("product_id", productId),
        Q.where("deleted_at", null)
      )
      .observe();
  },
};
