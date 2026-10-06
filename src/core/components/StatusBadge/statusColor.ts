import { resolveListAccent, type ListAccent } from "../List/accent";

/** Color of a status: a module / context / neutral accent, or explicit tint + fill. */
export type StatusColor = ListAccent | { tint: string; fill: string };

/** Text / dot color and the tinted pill fill of a status. */
export function resolveStatusColor(color: StatusColor): { tint: string; fill: string } {
  if (typeof color !== "string") return color;
  const { tint, fill } = resolveListAccent(color);
  return { tint, fill };
}
