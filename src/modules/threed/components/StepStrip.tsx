import { resolveListAccent, withAlpha } from "@/core/components";
import { LinearGradient } from "expo-linear-gradient";
import { Plus } from "lucide-react-native";
import { ScrollView } from "react-native";
import { Text, View, XStack, YStack } from "tamagui";

const lime = resolveListAccent("threed");
const SIZE = 44;

export interface StepStripProps {
  count: number;
  /** Index of the step in the editor; null while the first step is not saved yet. */
  current: number | null;
  onSelect: (index: number) => void;
  onAdd: () => void;
  disabled?: boolean;
}

/** STEPS row of the editor (D8): numbered 44px squares, the current one in the lime gradient, dashed Add step. */
export function StepStrip({ count, current, onSelect, onAdd, disabled }: StepStripProps) {
  return (
    <YStack gap={10}>
      <Text fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted">
        {t("threedSteps")}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
        <XStack gap={8}>
          {Array.from({ length: count }, (_, index) => {
            const on = index === current;
            const label = (
              <Text fontSize={15} fontWeight="$button" color={on ? lime.onGradient : "$neutralSoft"}>
                {index + 1}
              </Text>
            );
            return (
              <View
                key={index}
                role="button"
                aria-label={t("threedStepNumber", { n: index + 1 })}
                aria-current={on ? "step" : undefined}
                onPress={disabled ? undefined : () => onSelect(index)}
                pressStyle={{ opacity: 0.85 }}
                width={SIZE}
                height={SIZE}
                borderRadius={14}
                overflow="hidden"
                borderWidth={on ? 0 : 1}
                borderColor="$neutralRaisedBorder"
                backgroundColor={on ? undefined : "$neutralRaised"}
                alignItems="center"
                justifyContent="center"
              >
                {on ? (
                  <LinearGradient
                    colors={[lime.from, lime.to]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}
                  >
                    {label}
                  </LinearGradient>
                ) : (
                  label
                )}
              </View>
            );
          })}
          <View
            role="button"
            aria-label={t("threedAddStep")}
            onPress={disabled ? undefined : onAdd}
            pressStyle={{ opacity: 0.85 }}
            opacity={disabled ? 0.5 : 1}
            width={SIZE}
            height={SIZE}
            borderRadius={14}
            borderWidth={1.5}
            borderStyle="dashed"
            borderColor={withAlpha(lime.tint, 0.5)}
            alignItems="center"
            justifyContent="center"
          >
            <Plus size={18} color={lime.tint} strokeWidth={2.8} />
          </View>
        </XStack>
      </ScrollView>
    </YStack>
  );
}
