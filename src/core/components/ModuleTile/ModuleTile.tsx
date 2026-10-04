import { moduleAccents, type ModuleKey } from "@/core/theme/tokens";
import { useRouter, type Href } from "expo-router";
import { Plus, type LucideIcon } from "lucide-react-native";
import { Text, View, YStack } from "tamagui";

export interface ModuleTileProps {
  /** Module accent: tints the icon square and the `+` quick action. */
  module: ModuleKey;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Route opened when the tile is pressed. */
  href?: Href;
  /** Route of the module's create flow. Without it the `+` is hidden. */
  addHref?: Href;
  /** Accessible label of the `+` button (default: "Add"). */
  addLabel?: string;
}

/**
 * Module tile (board S, 1A "Manage"): module-tinted icon, title, one-line
 * description and an optional `+` quick action top-right. Lay tiles out in a
 * 2-column grid with a 12px gap.
 */
export function ModuleTile({
  module,
  icon: Icon,
  title,
  subtitle,
  href,
  addHref,
  addLabel,
}: ModuleTileProps) {
  const router = useRouter();
  const accent = moduleAccents[module];

  return (
    <YStack
      role={href ? "button" : undefined}
      aria-label={title}
      onPress={href ? () => router.push(href) : undefined}
      pressStyle={href ? { opacity: 0.85 } : undefined}
      position="relative"
      justifyContent="space-between"
      gap={16}
      minHeight={148}
      padding={16}
      borderRadius="$card"
      borderWidth={1}
      borderColor="$neutralCardBorder"
      backgroundColor="$neutralCard"
    >
      <View
        width={44}
        height={44}
        borderRadius="$tileIcon"
        backgroundColor={accent.fill}
        alignItems="center"
        justifyContent="center"
      >
        <Icon size={22} color={accent.tint} strokeWidth={2} />
      </View>

      <YStack gap={3}>
        <Text fontSize="$tileTitle" fontWeight="$tileTitle" color="$neutralText" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            fontSize="$secondary"
            fontWeight="$secondary"
            lineHeight={18}
            color="$neutralMuted"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </YStack>

      {addHref ? (
        <View
          role="button"
          aria-label={addLabel ?? t("add")}
          onPress={() => router.push(addHref)}
          pressStyle={{ opacity: 0.8 }}
          hitSlop={4}
          position="absolute"
          top={12}
          right={12}
          width={40}
          height={40}
          borderRadius={20}
          backgroundColor={accent.fill}
          alignItems="center"
          justifyContent="center"
        >
          <Plus size={18} color={accent.tint} strokeWidth={2.8} />
        </View>
      ) : null}
    </YStack>
  );
}
