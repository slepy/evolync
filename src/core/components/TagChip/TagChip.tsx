import { moduleAccents } from "@/core/theme/tokens";
import { X } from "lucide-react-native";
import { Text, View, XStack } from "tamagui";

const rose = moduleAccents.tags;
const ROSE_TEXT = rose.label;

export interface TagChipProps {
  label: string;
  /** "sm": 26px chip under a list row title (T2). "md": 36px chip of a form's TAGS field (T4). */
  size?: "sm" | "md";
  /** Shows the `×` that removes the tag (T4). */
  onRemove?: () => void;
}

/** A tag. Every tag is Tags rose, whatever color it was saved with. */
export function TagChip({ label, size = "sm", onRemove }: TagChipProps) {
  const md = size === "md";

  return (
    <XStack
      alignItems="center"
      gap={6}
      height={md ? 36 : 26}
      paddingLeft={md ? 12 : 9}
      paddingRight={onRemove ? 4 : md ? 12 : 9}
      borderRadius={md ? 18 : 13}
      backgroundColor={rose.fill}
      flexShrink={0}
    >
      <Text fontSize={md ? 13 : 12} fontWeight="700" color={ROSE_TEXT} numberOfLines={1}>
        {label}
      </Text>
      {onRemove ? (
        <View
          role="button"
          aria-label={t("tagsRemove", { name: label })}
          onPress={onRemove}
          pressStyle={{ opacity: 0.7 }}
          hitSlop={6}
          width={24}
          height={24}
          borderRadius={12}
          alignItems="center"
          justifyContent="center"
        >
          <X size={14} color={ROSE_TEXT} strokeWidth={2.6} />
        </View>
      ) : null}
    </XStack>
  );
}
