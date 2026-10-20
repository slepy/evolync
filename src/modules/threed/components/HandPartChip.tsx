import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "tamagui";
import { resolveListAccent } from "@/core/components";

const lime = resolveListAccent("threed");

export interface PartChipProps {
  label: string;
  on: boolean;
  onPress: () => void;
}

/** 36px finger chip: lime gradient when chosen, page fill otherwise. */
export function PartChip({ label, on, onPress }: PartChipProps) {
  const text = (
    <Text fontSize={13} fontWeight="$button" color={on ? lime.onGradient : "$neutralSoft"}>
      {label}
    </Text>
  );
  return (
    <View
      role="radio"
      aria-checked={on}
      aria-label={label}
      onPress={onPress}
      pressStyle={{ opacity: 0.85 }}
      height={36}
      borderRadius={18}
      overflow="hidden"
      borderWidth={on ? 0 : 1}
      borderColor="$neutralRaisedBorder"
      backgroundColor={on ? undefined : "$neutralPage"}
      justifyContent="center"
    >
      {on ? (
        <LinearGradient
          colors={[lime.from, lime.to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height: 36, paddingHorizontal: 13, justifyContent: "center" }}
        >
          {text}
        </LinearGradient>
      ) : (
        <View paddingHorizontal={13}>{text}</View>
      )}
    </View>
  );
}
