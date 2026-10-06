import { resolveListAccent } from "@/core/components";
import { neutral } from "@/core/theme/tokens";
import { Minus, Plus } from "lucide-react-native";
import React from "react";
import { Text, XStack } from "tamagui";

const accent = resolveListAccent("orders");

/** − n + of a size row (12F): 44px buttons, − outlined and faded at 0, the count in the Orders violet once set. */
export function QuantityStepper({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  const on = value > 0;
  return (
    <XStack alignItems="center" gap={4} flexShrink={0}>
      <XStack
        role="button"
        aria-label={t("ordersDecrease", { name: label })}
        aria-disabled={!on}
        onPress={on ? () => onChange(value - 1) : undefined}
        pressStyle={on ? { opacity: 0.8 } : undefined}
        opacity={on ? 1 : 0.35}
        width={44}
        height={44}
        borderRadius={22}
        borderWidth={1}
        borderColor="$neutralRaisedBorder"
        backgroundColor="$neutralRaised"
        alignItems="center"
        justifyContent="center"
      >
        <Minus size={18} color={neutral.text} strokeWidth={2.4} />
      </XStack>
      <Text minWidth={28} textAlign="center" fontSize={17} fontWeight="$rowTitle" color={on ? accent.tint : neutral.placeholder}>
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
        backgroundColor={accent.fill}
        alignItems="center"
        justifyContent="center"
      >
        <Plus size={18} color={accent.tint} strokeWidth={2.4} />
      </XStack>
    </XStack>
  );
}
