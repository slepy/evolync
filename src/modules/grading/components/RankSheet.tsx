import {
  FormSheet,
  PrimaryButton,
  SelectField,
  TextField,
  TrashButton,
} from "@/core/components";
import type GradingRank from "@/database/models/GradingRank";
import { confirmDelete } from "@/core/utils/confirmDelete";
import React, { useEffect, useState } from "react";
import { addRank, deleteRank, updateRank } from "../services/gradingService";
import { createRankSchema } from "../validation";
import { RankColorPicker } from "./RankColorPicker";
import { RankIcon } from "./RankIcon";
import { canSubmitRank, pickerStartColor } from "./rankSheetState";

const NAME_MAX_LENGTH = 50;

interface RankSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  /** Rank to edit (8C); without it the sheet adds a new rank (8B). */
  rank?: GradingRank | null;
}

/**
 * Bottom sheet that adds a rank (Create) or edits / deletes one (Save, trash).
 * The COLOR field switches the sheet to the color picker (8D).
 */
export const RankSheet: React.FC<RankSheetProps> = ({
  open,
  onOpenChange,
  organizationId,
  rank,
}) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [pickedColor, setPickedColor] = useState(pickerStartColor(null));
  const [error, setError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const editing = !!rank;

  useEffect(() => {
    if (!open) return;
    setName(rank?.name ?? "");
    setColor(rank?.color ?? null);
    setPicking(false);
    setError(undefined);
  }, [open, rank]);

  const trimmed = name.trim();
  const canSubmit = canSubmitRank(name, color, rank);

  const handleSubmit = async () => {
    if (!canSubmit || isSaving) return;

    const result = createRankSchema.safeParse({
      name: trimmed,
      color: color ?? undefined,
    });
    if (!result.success) {
      setError(t(result.error.issues[0].message));
      return;
    }

    setIsSaving(true);
    setError(undefined);
    try {
      if (rank) await updateRank(organizationId, rank.id, result.data);
      else await addRank(organizationId, result.data);
      onOpenChange(false);
    } catch (err) {
      setError(t(err instanceof Error ? err.message : "errorUnknown"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!rank) return;
    confirmDelete(t("delete"), t("gradingDeleteRankConfirm"), async () => {
      await deleteRank(organizationId, rank.id);
      onOpenChange(false);
    });
  };

  const openPicker = () => {
    setPickedColor(pickerStartColor(color));
    setPicking(true);
  };

  return (
    <FormSheet
      open={open}
      // Closing the picker goes back to the form, not out of the sheet.
      onOpenChange={(next) =>
        picking && !next ? setPicking(false) : onOpenChange(next)
      }
      title={
        picking
          ? t("gradingPickColor")
          : editing
            ? t("gradingEditRank")
            : t("gradingNewRank")
      }
      headerAction={
        editing && !picking ? (
          <TrashButton onPress={handleDelete} disabled={isSaving} />
        ) : undefined
      }
      footer={
        picking ? (
          <PrimaryButton
            label={t("confirm")}
            accent="grading"
            onPress={() => {
              setColor(pickedColor);
              setPicking(false);
            }}
          />
        ) : (
          <PrimaryButton
            label={editing ? t("save") : t("create")}
            accent="grading"
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={isSaving}
          />
        )
      }
    >
      {picking ? (
        <RankColorPicker initialColor={pickerStartColor(color)} onChange={setPickedColor} />
      ) : (
        <>
          <TextField
            label={t("fieldName")}
            value={name}
            onChangeText={(value) => {
              setName(value);
              setError(undefined);
            }}
            placeholder={t("gradingRankNamePlaceholder")}
            accent="grading"
            maxLength={NAME_MAX_LENGTH}
            error={error}
            autoFocus={!editing}
          />
          <SelectField
            label={t("fieldColor")}
            value={color ?? undefined}
            placeholder={t("gradingPickColor")}
            leading={color ? <RankIcon color={color} size={36} /> : undefined}
            onPress={openPicker}
            chevron="right"
            accent="grading"
          />
        </>
      )}
    </FormSheet>
  );
};
