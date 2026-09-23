import { database } from "@/database";
import Product from "@/database/models/Product";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

export const ProductRepository = {
  async create(data: Partial<Product>): Promise<Product> {
    const productsCollection = database.get<Product>("products");
    return await database.write(async () => {
      return await productsCollection.create((record) => {
        record._raw.id = uuidv4();
        Object.assign(record, data);
      });
    });
  },

  async findById(id: string, includeDeleted = false): Promise<Product | null> {
    const productsCollection = database.get<Product>("products");
    try {
      const product = await productsCollection.find(id);
      if (!includeDeleted && product.deletedAt) {
        return null;
      }
      return product;
    } catch {
      return null;
    }
  },

  async findByOrganizationId(organizationId: string): Promise<Product[]> {
    const productsCollection = database.get<Product>("products");
    return await productsCollection
      .query(
        Q.where("organization_id", organizationId),
        Q.where("deleted_at", null)
      )
      .fetch();
  },

  async update(id: string, data: Partial<Product>): Promise<Product> {
    const productsCollection = database.get<Product>("products");
    const existing = await productsCollection.find(id);
    return await database.write(async () => {
      return await existing.update((record) => {
        Object.assign(record, data);
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const productsCollection = database.get<Product>("products");
    const product = await productsCollection.find(id);
    await database.write(async () => {
      await product.update((record) => {
        record.deletedAt = new Date();
      });
    });
  },

  // Observable methods for reactive UI
  observeByOrganizationId(organizationId: string) {
    const productsCollection = database.get<Product>("products");
    return productsCollection
      .query(
        Q.where("organization_id", organizationId),
        Q.where("deleted_at", null)
      )
      .observe();
  },

  observeById(id: string) {
    const productsCollection = database.get<Product>("products");
    return productsCollection.findAndObserve(id);
  },
};
