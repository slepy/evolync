import { AlertBanner, PrimaryButton, SubScreenPage, TextField } from "@/core/components";
import { TagsField } from "@/modules/tags";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, YStack } from "tamagui";
import { createSequence } from "../services";
import { THREED_DESCRIPTION_MAX, THREED_TITLE_MAX } from "../validation";

const TITLE_ERRORS = ["threedValidationTitleRequired", "threedValidationTitleTooLong"];

/** New sequence (D5): TITLE, DESCRIPTION, TAGS, Create in 3D lime; the editor then opens on step 1. */
export function SequenceCreateScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [saveError, setSaveError] = useState(false);

  const handleCreate = async () => {
    if (isSaving || !title.trim()) return;
    setIsSaving(true);
    setSaveError(false);
    try {
      const sequence = await createSequence({ title, description: description.trim() || undefined, tagIds });
      router.replace(`/techniques/threed/${sequence.id}` as any);
      router.push(`/techniques/threed/${sequence.id}/edit` as any);
    } catch (err) {
      const key = err instanceof Error ? err.message : "";
      if (TITLE_ERRORS.includes(key)) setTitleError(t(key));
      else {
        console.error("[SequenceCreateScreen] create:", err);
        setSaveError(true);
      }
      setIsSaving(false);
    }
  };

  return (
    <SubScreenPage
      title={t("threedCreateSequence")}
      right={false}
      footer={
        <PrimaryButton
          label={t("create")}
          accent="threed"
          onPress={handleCreate}
          disabled={!title.trim()}
          loading={isSaving}
        />
      }
    >
      {saveError ? <AlertBanner title={t("errorCreateFailed")} onDismiss={() => setSaveError(false)} /> : null}
      <YStack gap={18}>
        <TextField
          size="large"
          label={t("notesDocumentTitle")}
          value={title}
          onChangeText={(next) => {
            setTitle(next);
            setTitleError(undefined);
          }}
          placeholder={t("threedSequenceTitlePlaceholder")}
          accent="threed"
          maxLength={THREED_TITLE_MAX}
          error={titleError}
          autoFocus
        />
        <TextField
          size="large"
          multiline
          label={t("fieldDescription")}
          value={description}
          onChangeText={setDescription}
          placeholder={t("threedSequenceDescriptionPlaceholder")}
          accent="threed"
          maxLength={THREED_DESCRIPTION_MAX}
        />
        <TagsField tagIds={tagIds} onChange={setTagIds} />
        <Text fontSize="$secondary" fontWeight="$secondary" color="$neutralMuted">
          {t("threedCreateHint")}
        </Text>
      </YStack>
    </SubScreenPage>
  );
}
