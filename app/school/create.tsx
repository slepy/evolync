import { AlertBanner, PrimaryButton, SubScreenPage, TextField } from "@/core/components";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { useCreateSchool } from "@/modules/school";
import { createSchoolSchema } from "@/modules/school/validation";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { YStack } from "tamagui";

/**
 * Screen for creating a new school
 *
 * Route: /school/create
 */
export default function CreateSchoolScreen() {
  useRequireOrganizationOwner();
  const router = useRouter();
  const { createSchool, isLoading, error, reset } = useCreateSchool();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string>();

  const handleChange = (value: string) => {
    setName(value);
    setNameError(undefined);
  };

  const handleSubmit = async () => {
    const parsed = createSchoolSchema.safeParse({ name });
    if (!parsed.success) {
      setNameError(parsed.error.issues[0]?.message);
      return;
    }
    const school = await createSchool(parsed.data);
    if (school) {
      router.replace(`/school/${school.id}/dashboard`);
    }
  };

  return (
    <SubScreenPage
      title={t("schoolCreateTitle")}
      onBack={() => router.back()}
      footer={
        <PrimaryButton
          label={t("schoolCreateSubmit")}
          accent="school"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
        />
      }
    >
      <YStack gap={16}>
        {error ? (
          <AlertBanner title={t("errorCreateFailed")} message={error} onDismiss={reset} />
        ) : null}
        <TextField
          label={t("schoolNameLabel")}
          value={name}
          onChangeText={handleChange}
          placeholder={t("schoolNamePlaceholder")}
          accent="school"
          maxLength={100}
          autoCapitalize="words"
          disabled={isLoading}
          error={nameError}
        />
      </YStack>
    </SubScreenPage>
  );
}
