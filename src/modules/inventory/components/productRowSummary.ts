/** Total stock at or below this is "low stock". */
export const LOW_STOCK_THRESHOLD = 5;

export type StockStatus = "in" | "low" | "out";

export interface PriceSummary {
  currency: string;
  /** Lowest variant price in this currency. */
  price: number;
  /** Several variants: shown as "from …". */
  from: boolean;
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
  const byCurrency = new Map<string, number>();
  for (const v of variants) {
    const lowest = byCurrency.get(v.currency);
    byCurrency.set(v.currency, lowest === undefined ? v.price : Math.min(lowest, v.price));
  }

  const totalStock = variants.reduce((sum, v) => sum + v.stockQuantity, 0);

  return {
    prices: Array.from(byCurrency, ([currency, price]) => ({
      currency,
      price,
      from: variants.length > 1,
    })),
    totalStock,
    stockStatus: stockStatusOf(totalStock),
    variantCount: variants.length,
    sizes: variants.length > 1 ? variants.map((v) => v.name.trim()).filter(Boolean) : [],
  };
}
