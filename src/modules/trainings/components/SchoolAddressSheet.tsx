import { BaseCard } from "@/modules/core/components";
import { Building2 } from "lucide-react-native";
import React from "react";
import { ScrollView } from "react-native";
import { Sheet, Text, XStack, YStack, useTheme } from "tamagui";
import type { SchoolAddressOption } from "../hooks/useSchoolsWithAddress";
import { pickSchoolAddress, toSchoolAddressItems } from "./schoolAddress";

interface SchoolAddressSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schools: SchoolAddressOption[];
  /** Receives the picked school's address (copied, then editable). */
  onPick: (address: string) => void;
}

export const SchoolAddressSheet: React.FC<SchoolAddressSheetProps> = ({ open, onOpenChange, schools, onPick }) => {
  const theme = useTheme();
  return (
    <Sheet modal open={open} onOpenChange={onOpenChange} snapPoints={[50]} dismissOnSnapToBottom zIndex={200}>
      <Sheet.Overlay backgroundColor="rgba(0, 0, 0, 0.5)" opacity={0.5} zIndex={199} />
      <Sheet.Frame
        padding="$4"
        backgroundColor="$background"
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
        zIndex={200}
      >
        <Sheet.Handle />
        <Text fontSize="$5" fontWeight="700" color="$textPrimary" marginBottom="$3">
          {t("trainingsUseSchoolAddress")}
        </Text>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <YStack gap="$1">
            {toSchoolAddressItems(schools).map((item) => (
              <BaseCard
                key={item.id}
                marginHorizontal={0}
                opacity={item.disabled ? 0.5 : 1}
                onPress={
                  item.disabled
                    ? undefined
                    : () => {
                        const address = pickSchoolAddress(item);
                        if (address) onPick(address);
                        onOpenChange(false);
                      }
                }
                accessibilityState={{ disabled: item.disabled }}
              >
                <XStack gap="$3" alignItems="center">
                  <Building2 size={20} color={theme.blue11?.val} />
                  <YStack flex={1}>
                    <Text fontSize="$4" fontWeight="600" color="$textPrimary">
                      {item.name}
                    </Text>
                    <Text fontSize="$3" color={item.disabled ? "$textMuted" : "$textSecondary"}>
                      {item.address ?? t("trainingsSchoolNoAddress")}
                    </Text>
                  </YStack>
                </XStack>
              </BaseCard>
            ))}
          </YStack>
        </ScrollView>
      </Sheet.Frame>
    </Sheet>
  );
};
