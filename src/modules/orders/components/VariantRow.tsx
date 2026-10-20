import { resolveListAccent } from "@/core/components";
import { neutral, warning } from "@/core/theme/tokens";
import { Minus, Plus } from "lucide-react-native";
import { Text, XStack, YStack } from "tamagui";

export interface VariantRowProps {
  label: string;
  name: string;
  price: string;
  stock: number;
  value: number;
  onChange: (value: number) => void;
}

/** One size of an expanded product: name, "price · stock", − n + (12F). */
export function VariantRow({
  label,
  name,
  price,
  stock,
  value,
  onChange,
}: VariantRowProps) {
  const a = resolveListAccent("orders");
  const picked = value > 0;
  return (
    <XStack
      alignItems="center"
      gap={6}
      paddingVertical={4}
      paddingRight={4}
      paddingLeft={12}
      borderRadius={14}
      backgroundColor={picked ? a.selectedFill : "transparent"}
    >
      <YStack flex={1} minWidth={0} gap={2}>
        <Text fontSize={14} fontWeight="800" color="$neutralText" numberOfLines={1}>
          {name}
        </Text>
        <Text fontSize={12} fontWeight="500" color="$neutralMuted" numberOfLines={1}>
          {`${price} · `}
          {stock > 0 ? (
            t("ordersStockAvailable", { count: stock })
          ) : (
            <Text fontSize={12} fontWeight="700" color={warning.text}>
              {t("statusOutOfStock")}
            </Text>
          )}
        </Text>
      </YStack>
      <XStack
        role="button"
        aria-label={t("ordersDecrease", { name: label })}
        aria-disabled={!picked}
        onPress={picked ? () => onChange(value - 1) : undefined}
        pressStyle={picked ? { opacity: 0.8 } : undefined}
        opacity={picked ? 1 : 0.35}
        width={44}
        height={44}
        borderRadius={22}
        borderWidth={1}
        borderColor="$neutralRaisedBorder"
        backgroundColor="$neutralRaised"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <Minus size={16} color={neutral.text} strokeWidth={2.6} />
      </XStack>
      <Text minWidth={24} textAlign="center" fontSize={16} fontWeight="800" color={picked ? a.tint : neutral.placeholder}>
        {value}
      </Text>
      <XStack
        role="button"
        aria-label={t("ordersIncrease", { name: label })}
        onPress={() => onChange(value + 1)}
        pressStyle={{ opacity: 0.8 }}
        width={44}
        height={44}
        borderRadius={22}
        backgroundColor={a.fill}
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <Plus size={16} color={a.tint} strokeWidth={2.6} />
      </XStack>
    </XStack>
  );
}
