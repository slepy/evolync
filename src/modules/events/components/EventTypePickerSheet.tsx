import { ActionPill, FormSheet, IconButton, ListCard, ListCheckbox, ListEmpty, ListIcon, ListRow, resolveListAccent } from "@/core/components";
import type EventType from "@/database/models/EventType";
import { CalendarDays, Plus, Settings2 } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView } from "react-native";
import { XStack } from "tamagui";
import { useEventTypes } from "../hooks";
import { EventTypeSheet } from "./EventTypeSheet";

const amber = resolveListAccent("events");

interface EventTypePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTypeId?: string;
  onSelect: (typeId: string) => void;
  /** Opens the Event types screen (rename / delete), from the header icon. */
  onManage?: () => void;
}

/**
 * Event type sheet — the tags sheet (T5) in the Events amber with a single
 * choice: one checkbox row per type, tapping a row checks it and unchecks the
 * previous one; Add new opens the create sheet and selects the type it
 * creates. The header icon (in T5's "N selected" slot) opens Event types.
 */
export const EventTypePickerSheet: React.FC<EventTypePickerSheetProps> = ({
  open,
  onOpenChange,
  selectedTypeId,
  onSelect,
  onManage,
}) => {
  const { types } = useEventTypes();
  const [createOpen, setCreateOpen] = useState(false);

  const openCreate = () => {
    onOpenChange(false);
    setCreateOpen(true);
  };

  const handleCreated = (eventType: EventType) => {
    onSelect(eventType.id);
    onOpenChange(true);
  };

  return (
    <>
      <FormSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t("eventsTypePicker")}
        headerAction={
          onManage ? (
            <IconButton
              icon={Settings2}
              label={t("eventsTypesManage")}
              onPress={() => {
                onOpenChange(false);
                onManage();
              }}
            />
          ) : undefined
        }
        footer={
          <XStack>
            <ActionPill label={t("addNew")} icon={Plus} tint={amber.label} fill={amber.fill} onPress={openCreate} />
          </XStack>
        }
      >
        {types.length > 0 ? (
          <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
            <ListCard aria-label={t("eventsTypePicker")}>
              {types.map((eventType) => {
                const checked = eventType.id === selectedTypeId;
                return (
                  <ListRow
                    key={eventType.id}
                    size="md"
                    title={eventType.name}
                    role="radio"
                    aria-checked={checked}
                    leading={<ListIcon icon={CalendarDays} accent="events" size={36} />}
                    trailing={<ListCheckbox checked={checked} accent="events" />}
                    onPress={() => onSelect(eventType.id)}
                  />
                );
              })}
            </ListCard>
          </ScrollView>
        ) : (
          <ListEmpty text={t("eventsTypesEmpty")} />
        )}
      </FormSheet>

      <EventTypeSheet open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreated} />
    </>
  );
};
