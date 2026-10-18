import { ListCard, ListEmpty, ListIcon, ListRow, ListSection, SubScreenPage } from "@/core/components";
import type EventType from "@/database/models/EventType";
import { LoadingScreen } from "@/core/components";
import { CalendarDays } from "lucide-react-native";
import React, { useState } from "react";
import { useEventTypes } from "../hooks";
import { EventTypeSheet } from "./EventTypeSheet";

/**
 * Event types (copy of the Tags list, 7A): "Your event types" with Add new in
 * the Events amber, one row per type. Add new opens the create sheet, a row
 * opens the edit sheet (rename, delete).
 */
export const EventTypesListScreen: React.FC = () => {
  const { types, isLoading } = useEventTypes();
  const [sheetOpen, setSheetOpen] = useState(false);
  // Kept while the sheet closes so its title does not flip mid-animation.
  const [edited, setEdited] = useState<EventType | null>(null);

  const openSheet = (eventType: EventType | null) => {
    setEdited(eventType);
    setSheetOpen(true);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <SubScreenPage title={t("eventsTypesTitle")}>
        <ListSection
          title={t("eventsTypesYourTypes")}
          accent="events"
          action={{ label: t("addNew"), onPress: () => openSheet(null) }}
        >
          {types.length > 0 ? (
            <ListCard aria-label={t("eventsTypesYourTypes")}>
              {types.map((eventType) => (
                <ListRow
                  key={eventType.id}
                  title={eventType.name}
                  leading={<ListIcon icon={CalendarDays} accent="events" />}
                  onPress={() => openSheet(eventType)}
                />
              ))}
            </ListCard>
          ) : (
            <ListEmpty text={t("eventsTypesEmpty")} />
          )}
        </ListSection>
      </SubScreenPage>

      <EventTypeSheet open={sheetOpen} eventType={edited} onOpenChange={setSheetOpen} />
    </>
  );
};
