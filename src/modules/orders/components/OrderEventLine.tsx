import { resolveListAccent } from "@/core/components";
import { CalendarDays } from "lucide-react-native";
import React from "react";
import { Text, XStack } from "tamagui";

export interface OrderEventLineProps {
  /** Name of the event the order was placed for. */
  name: string;
}

/** Line under an order row's subtitle (12A): calendar icon in the events accent, the event name. */
export const OrderEventLine: React.FC<OrderEventLineProps> = ({ name }) => (
  <XStack alignItems="center" gap={5} minWidth={0} flexShrink={1}>
    <CalendarDays size={13} color={resolveListAccent("events").tint} strokeWidth={2.2} />
    <Text flexShrink={1} fontSize={12.5} fontWeight="600" color="$neutralMuted" numberOfLines={1}>
      {name}
    </Text>
  </XStack>
);
