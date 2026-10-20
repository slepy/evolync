import { contextColors, type ContextKey } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { Text, View, XStack, YStack } from "tamagui";
import type { CalendarDayCell } from "./calendarMonth";
import { EVENT, TRAINING, LANE_COLORS } from "./calendarColors";

export interface DayCellProps {
  cell: CalendarDayCell;
  context: ContextKey;
  label: string;
  onPress: () => void;
}

export function DayCell({
  cell,
  context,
  label,
  onPress,
}: DayCellProps) {
  const c = contextColors[context];

  return (
    <YStack
      role="button"
      aria-label={label}
      aria-selected={cell.isSelected}
      onPress={onPress}
      pressStyle={{ opacity: 0.8 }}
      flex={1}
      height={62}
      gap={3}
    >
      <XStack justifyContent="center">
        <View
          width={30}
          height={30}
          borderRadius={15}
          overflow="hidden"
          alignItems="center"
          justifyContent="center"
          borderWidth={!cell.isSelected && cell.isToday ? 1.5 : 0}
          borderColor={c.label}
        >
          {cell.isSelected ? (
            <LinearGradient
              colors={[c.gradient[0].color, c.gradient[c.gradient.length - 1].color]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          <Text
            fontSize={15}
            fontWeight="$section"
            color={cell.isSelected ? c.fg : cell.isToday ? c.label : "$neutralText"}
          >
            {cell.dayOfMonth}
          </Text>
        </View>
      </XStack>

      {cell.lanes.map((segment, lane) => (
        <View
          key={lane}
          height={5}
          backgroundColor={segment ? LANE_COLORS[lane] : "transparent"}
          marginLeft={segment?.isStart ? 6 : 0}
          marginRight={segment?.isEnd ? 6 : 0}
          borderTopLeftRadius={segment?.isStart ? 3 : 0}
          borderBottomLeftRadius={segment?.isStart ? 3 : 0}
          borderTopRightRadius={segment?.isEnd ? 3 : 0}
          borderBottomRightRadius={segment?.isEnd ? 3 : 0}
        />
      ))}

      <XStack height={6} alignItems="center" justifyContent="center" gap={3}>
        {cell.hasEvent ? <View width={6} height={6} borderRadius={3} backgroundColor={EVENT.from} /> : null}
        {cell.hasTraining ? <View width={6} height={6} borderRadius={1.5} backgroundColor={TRAINING.tint} /> : null}
      </XStack>
    </YStack>
  );
}
