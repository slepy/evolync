import { Children, Fragment, isValidElement, type ReactNode } from "react";
import { View, YStack } from "tamagui";

export interface ListCardProps {
  /** `ListRow`s. A 1px divider inset 16px is drawn between them, never after the last one. */
  children: ReactNode;
  /** "group" for a checkbox list or a select sheet, "radiogroup"… */
  role?: "list" | "group" | "radiogroup";
  "aria-label"?: string;
}

/**
 * One card holding the rows of a list (board S section 1, 1A "Your schools").
 * Rows are flat; the card owns the background, border, radius and dividers.
 */
export function ListCard({ children, role = "list", "aria-label": ariaLabel }: ListCardProps) {
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <YStack
      role={role}
      aria-label={ariaLabel}
      overflow="hidden"
      borderRadius="$card"
      borderWidth={1}
      borderColor="$neutralCardBorder"
      backgroundColor="$neutralCard"
    >
      {rows.map((row, index) => (
        <Fragment key={row.key ?? index}>
          {index > 0 ? <ListDivider /> : null}
          {row}
        </Fragment>
      ))}
    </YStack>
  );
}

export function ListDivider() {
  return <View height={1} marginHorizontal={16} backgroundColor="$neutralCardBorder" />;
}
