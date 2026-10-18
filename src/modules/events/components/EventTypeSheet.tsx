import { FormSheet, Notice, PrimaryButton, TextField, TrashButton } from "@/core/components";
import type EventType from "@/database/models/EventType";
import { confirmDelete } from "@/core/utils/confirmDelete";
import { useStore } from "@/store";
import React, { useEffect, useState } from "react";
import { YStack } from "tamagui";
import { createEventType, deleteEventType, EventTypeInUseError, renameEventType } from "../services";
import { EVENT_TYPE_NAME_MAX } from "../validation";

interface EventTypeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Type to edit (7C pattern); without it the sheet creates a new type (7B pattern). */
  eventType?: EventType | null;
  /** Called with the new type after Create (the event type picker selects it). */
  onCreated?: (eventType: EventType) => void;
}

/**
 * Bottom sheet that adds an event type (Create) or renames / deletes one
 * (Save, trash) — a copy of the tag sheet (7B / 7C) in the Events amber.
 * A type still used by events is not deleted: a notice gives their count.
 */
export const EventTypeSheet: React.FC<EventTypeSheetProps> = ({ open, onOpenChange, eventType, onCreated }) => {
  const user = useStore((s) => s.user);
  const organization = useStore((s) => s.organization);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const editing = !!eventType;

  useEffect(() => {
    if (open) {
      setName(eventType?.name ?? "");
      setError(undefined);
      setNotice(undefined);
    }
  }, [open, eventType]);

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && (!editing || trimmed !== eventType.name);

  const handleSubmit = async () => {
    if (!canSubmit || isSaving || (!eventType && (!user || !organization))) return;
    setIsSaving(true);
    try {
      if (eventType) {
        await renameEventType(eventType.id, trimmed);
      } else if (user && organization) {
        const created = await createEventType({ organizationId: organization.id, name: trimmed, createdBy: user.id });
        onCreated?.(created);
      }
      onOpenChange(false);
    } catch (err) {
      setError(t(err instanceof Error ? err.message : "errorUnknown"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!eventType) return;
    confirmDelete(t("eventsTypeDeleteConfirm"), "", async () => {
      try {
        await deleteEventType(eventType.id);
        onOpenChange(false);
      } catch (err) {
        if (err instanceof EventTypeInUseError) setNotice(t("eventTypeInUse", { count: err.count }));
        else setError(t(err instanceof Error ? err.message : "errorUnknown"));
      }
    });
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? t("eventsTypeEdit") : t("eventsTypeCreateNew")}
      headerAction={editing ? <TrashButton onPress={handleDelete} disabled={isSaving} /> : undefined}
      footer={
        <PrimaryButton
          label={editing ? t("save") : t("create")}
          accent="events"
          onPress={handleSubmit}
          disabled={!canSubmit}
          loading={isSaving}
        />
      }
    >
      <YStack gap={12}>
        {notice ? <Notice text={notice} /> : null}
        <TextField
          label={t("fieldName")}
          value={name}
          onChangeText={(value) => {
            setName(value);
            setError(undefined);
          }}
          placeholder={t("eventsTypeNamePlaceholder")}
          accent="events"
          maxLength={EVENT_TYPE_NAME_MAX}
          error={error}
          autoFocus
          autoCapitalize="sentences"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
      </YStack>
    </FormSheet>
  );
};
