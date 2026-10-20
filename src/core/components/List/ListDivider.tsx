import { View } from "tamagui";

/** 1px divider inset 16px between the rows of a `ListCard`. */
export function ListDivider() {
  return <View height={1} marginHorizontal={16} backgroundColor="$neutralCardBorder" />;
}
