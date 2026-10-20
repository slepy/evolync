import { FormSheet, PrimaryButton, TextField } from "@/core/components";
import { useState } from "react";
import { THREED_TITLE_MAX } from "../validation";

export interface SavePresetSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => Promise<void>;
}

export function SavePresetSheet({
  open,
  onOpenChange,
  onSave,
}: SavePresetSheetProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(undefined);
    try {
      await onSave(name.trim());
      setName("");
      onOpenChange(false);
    } catch (err) {
      console.error("[HandEditorPanel] save preset:", err);
      setError(t(err instanceof Error ? err.message : "handPresetSaveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("threedNewPreset")}
      footer={<PrimaryButton label={t("save")} accent="threed" onPress={handleSave} disabled={!name.trim()} loading={saving} />}
    >
      <TextField
        size="large"
        label={t("fieldName")}
        value={name}
        onChangeText={(next) => {
          setName(next);
          setError(undefined);
        }}
        placeholder={t("threedPresetNamePlaceholder")}
        accent="threed"
        maxLength={THREED_TITLE_MAX}
        error={error}
        autoFocus
      />
    </FormSheet>
  );
}
