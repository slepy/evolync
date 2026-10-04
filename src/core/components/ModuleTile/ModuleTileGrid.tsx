import { Children, isValidElement, type ReactNode } from "react";
import { Text, XStack, YStack } from "tamagui";

export interface ModuleTileGridProps {
  /** Section title above the grid ("Manage"). */
  title?: string;
  /** `ModuleTile`s, laid out two per row. */
  children: ReactNode;
}

/** Section of module tiles in a 2-column grid with 12px gaps (1A "Manage"). */
export function ModuleTileGrid({ title, children }: ModuleTileGridProps) {
  const tiles = Children.toArray(children).filter(isValidElement);
  const rows: (typeof tiles)[] = [];
  for (let i = 0; i < tiles.length; i += 2) rows.push(tiles.slice(i, i + 2));

  return (
    <YStack gap={14}>
      {title ? (
        <Text fontSize="$section" fontWeight="$section" letterSpacing={-0.2} color="$neutralText">
          {title}
        </Text>
      ) : null}
      <YStack gap={12}>
        {rows.map((row, index) => (
          <XStack key={index} gap={12}>
            {row.map((tile, column) => (
              <YStack key={tile.key ?? column} flex={1} minWidth={0}>
                {tile}
              </YStack>
            ))}
            {row.length === 1 ? <YStack flex={1} /> : null}
          </XStack>
        ))}
      </YStack>
    </YStack>
  );
}
