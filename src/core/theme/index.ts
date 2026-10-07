import { useColorScheme } from "react-native";
import { resolveTheme, type ResolvedTheme } from "./resolve";

export type { ResolvedTheme } from "./resolve";
export * from "./tokens";

export function useResolvedTheme(): ResolvedTheme {
  return resolveTheme(useColorScheme());
}
