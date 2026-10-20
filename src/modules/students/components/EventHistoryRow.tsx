import { ListIcon } from "@/core/components";
import { Calendar, CalendarDays, FileText, MapPin } from "lucide-react-native";
import React from "react";
import { Text, XStack, YStack } from "tamagui";
import { MetaLine } from "./MetaLine";

export interface EventHistoryRowProps {
  title: string;
  amount?: string;
  when: string;
  place?: string;
  note?: string;
  status: React.ReactNode;
}

/** Event row of 16E3: title with the price, date, place and the short note under it; status button on the right. */
export function EventHistoryRow({
  title,
  amount,
  when,
  place,
  note,
  status,
}: EventHistoryRowProps) {
  return (
    <XStack alignItems="center" gap={12} paddingVertical={14} paddingHorizontal={16}>
      <ListIcon icon={CalendarDays} accent="events" size={44} />
      <YStack flex={1} minWidth={0} gap={4}>
        <XStack alignItems="baseline" gap={8}>
          <Text flex={1} fontSize={15} fontWeight="$rowTitle" color="$neutralText" numberOfLines={1}>
            {title}
          </Text>
          {amount ? (
            <Text fontSize={14} fontWeight="$button" color="$neutralText" flexShrink={0}>
              {amount}
            </Text>
          ) : null}
        </XStack>
        <MetaLine icon={Calendar} text={when} weight="600" />
        {place ? <MetaLine icon={MapPin} text={place} /> : null}
        {note ? <MetaLine icon={FileText} text={note} italic /> : null}
      </YStack>
      {status}
    </XStack>
  );
}
