/** Total stock at or below this is "low stock". */
export const LOW_STOCK_THRESHOLD = 5;

export type StockStatus = "in" | "low" | "out";

export interface PriceSummary {
  currency: string;
  /** Lowest variant price in this currency. */
  price: number;
  /** Several variants: shown as "from …". */
  from: boolean;
  /** Stock of the variants in this currency; the chip of 9A is colored by it. */
  stock: number;
  stockStatus: StockStatus;
}

export interface ProductRowSummary {
  /** One entry per currency, in the order the variants use them. */
  prices: PriceSummary[];
  totalStock: number;
  stockStatus: StockStatus;
  variantCount: number;
  /** Variant names when there are several ("S", "M"); empty for a one-size product. */
  sizes: string[];
}

interface VariantLike {
  name: string;
  price: number;
  currency: string;
  stockQuantity: number;
}

export function stockStatusOf(totalStock: number): StockStatus {
  if (totalStock <= 0) return "out";
  if (totalStock <= LOW_STOCK_THRESHOLD) return "low";
  return "in";
}

/**
 * Data of a product row (9A): lowest price per currency (variants do not
 * have to share one, so amounts are never blended), stock across variants.
 */
export function summarizeProductRow(variants: VariantLike[]): ProductRowSummary {
  const byCurrency = new Map<string, { price: number; stock: number }>();
  for (const v of variants) {
    const entry = byCurrency.get(v.currency);
    byCurrency.set(v.currency, {
      price: entry === undefined ? v.price : Math.min(entry.price, v.price),
      stock: (entry?.stock ?? 0) + v.stockQuantity,
    });
  }

  const totalStock = variants.reduce((sum, v) => sum + v.stockQuantity, 0);

  return {
    prices: Array.from(byCurrency, ([currency, { price, stock }]) => ({
      currency,
      price,
      from: variants.length > 1,
      stock,
      stockStatus: stockStatusOf(stock),
    })),
    totalStock,
    stockStatus: stockStatusOf(totalStock),
    variantCount: variants.length,
    sizes: variants.length > 1 ? variants.map((v) => v.name.trim()).filter(Boolean) : [],
  };
}
