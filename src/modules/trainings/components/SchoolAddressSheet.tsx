import { FormSheet, ListCard, ListIcon, ListRow } from "@/core/components";
import { School } from "lucide-react-native";
import React from "react";
import { ScrollView } from "react-native";
import { YStack } from "tamagui";
import type { SchoolAddressOption } from "../hooks/useSchoolsWithAddress";
import { pickSchoolAddress, toSchoolAddressItems } from "./schoolAddress";

interface SchoolAddressSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schools: SchoolAddressOption[];
  /** Receives the picked school's address (copied, then editable). */
  onPick: (address: string) => void;
}

/** "Use school address": one row per school; schools without an address are dimmed. */
export const SchoolAddressSheet: React.FC<SchoolAddressSheetProps> = ({ open, onOpenChange, schools, onPick }) => (
  <FormSheet open={open} onOpenChange={onOpenChange} title={t("trainingsUseSchoolAddress")}>
    <ScrollView style={{ maxHeight: 420 }}>
      <ListCard>
        {toSchoolAddressItems(schools).map((item) => (
          <YStack key={item.id} opacity={item.disabled ? 0.5 : 1}>
            <ListRow
              size="md"
              title={item.name}
              subtitle={item.address ?? t("trainingsSchoolNoAddress")}
              leading={<ListIcon icon={School} accent="school" size={44} />}
              aria-label={`${item.name}, ${item.address ?? t("trainingsSchoolNoAddress")}`}
              onPress={
                item.disabled
                  ? undefined
                  : () => {
                      const address = pickSchoolAddress(item);
                      if (address) onPick(address);
                      onOpenChange(false);
                    }
              }
            />
          </YStack>
        ))}
      </ListCard>
    </ScrollView>
  </FormSheet>
);
