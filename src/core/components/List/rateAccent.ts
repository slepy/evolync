import type { ListAccent } from "./accent";

/**
 * Color of a rate chip ("70%", "6/10", 13A / 14A): 80% or more green,
 * 50–79% amber, below 50% red; nothing counted yet stays neutral.
 */
export function rateAccent(done: number, total: number): ListAccent {
  if (total <= 0) return "neutral";
  const rate = done / total;
  if (rate >= 0.8) return "success";
  if (rate >= 0.5) return "warning";
  return "danger";
}

/** Whole percent of `done` in `total` (0 when there is nothing to count). */
export function ratePercent(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}
