import { CalendarDays, Repeat } from "lucide-react-native";
import { Text } from "tamagui";
import { FormSheet } from "../FormSheet/FormSheet";
import { ListCard } from "../List/ListCard";
import { ListIcon } from "../List/ListParts";
import { ListRow } from "../List/ListRow";
import type { CalendarSource } from "./useCalendarMonth";

export interface CalendarAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The selected day, e.g. "Saturday, 22 Nov". */
  dayLabel: string;
  onPick: (kind: CalendarSource) => void;
}

/** "Add new" on a calendar day (6B): Event or Training; the day becomes the start date. */
export function CalendarAddSheet({ open, onOpenChange, dayLabel, onPick }: CalendarAddSheetProps) {
  return (
    <FormSheet open={open} onOpenChange={onOpenChange} title={t("addNew")} subtitle={dayLabel}>
      <ListCard role="list" aria-label={t("addNew")}>
        <ListRow
          title={t("calendarKindEvent")}
          subtitle={t("calendarAddEventHint")}
          leading={<ListIcon icon={CalendarDays} accent="events" />}
          onPress={() => onPick("events")}
        />
        <ListRow
          title={t("calendarKindTraining")}
          subtitle={t("calendarAddTrainingHint")}
          leading={<ListIcon icon={Repeat} accent="trainings" />}
          onPress={() => onPick("trainings")}
        />
      </ListCard>
      <Text fontSize={12.5} fontWeight="$secondary" color="$neutralMuted">
        {t("calendarAddStartDateHint")}
      </Text>
    </FormSheet>
  );
}
