import { ListIcon, PhoneField, PrimaryButton, SubScreenPage, TextField } from "@/core/components";
import { PHONE_PREFIXES } from "@/modules/core/components/PhoneInput";
import { useDirtyFlag } from "@/modules/core/hooks";
import { Info } from "lucide-react-native";
import React, { useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { studentSchema, type StudentFormValues } from "../validation";

type Field = "displayName" | "email" | "phoneNumber";

interface StudentFormScreenProps {
  /** Saved student (edit); without it the screen adds one (16C). */
  initial?: StudentFormValues;
  /** Persists the validated values; a thrown error is shown above the button. */
  onSubmit: (data: StudentFormValues) => Promise<void>;
}

/**
 * New student (16C) / Edit student: FULL NAME, EMAIL (OPTIONAL), PHONE
 * (OPTIONAL) with the country prefix; a new one gets the "Added without an
 * app account" note. Create is pinned at the bottom; Save waits for a change.
 */
export const StudentFormScreen: React.FC<StudentFormScreenProps> = ({ initial, onSubmit }) => {
  const editing = !!initial;
  const [name, setName] = useState(initial?.displayName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phoneNumber ?? { prefix: "+48", number: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const { isDirty, markDirty } = useDirtyFlag();

  const touched = (field: Field) => {
    markDirty();
    setErrors((e) => ({ ...e, [field]: undefined }));
    setSubmitError(undefined);
  };

  const handleSubmit = async () => {
    if (isSaving) return;
    const result = studentSchema.safeParse({ displayName: name, email: email.trim(), phoneNumber: phone });
    if (!result.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of result.error.issues) next[issue.path[0] as Field] ??= t(issue.message);
      setErrors(next);
      return;
    }
    setIsSaving(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t(editing ? "studentEditError" : "errorCreateFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const showButton = !editing || isDirty;

  return (
    <SubScreenPage
      title={editing ? t("studentEditTitle") : t("studentCreateTitle")}
      context="school"
      footer={
        showButton ? (
          <YStack gap={10}>
            {submitError ? (
              <Text fontSize={12.5} fontWeight="$secondary" color="$trashText" textAlign="center">
                {submitError}
              </Text>
            ) : null}
            <PrimaryButton
              label={editing ? t("save") : t("create")}
              accent="students"
              onPress={handleSubmit}
              loading={isSaving}
            />
          </YStack>
        ) : undefined
      }
    >
      <YStack gap={18}>
        <TextField
          label={t("studentNameLabel")}
          value={name}
          onChangeText={(value) => {
            setName(value);
            touched("displayName");
          }}
          placeholder={t("studentNamePlaceholder")}
          accent="students"
          autoFocus={!editing}
          autoCapitalize="words"
          maxLength={100}
          error={errors.displayName}
        />
        <TextField
          label={t("emailOptional")}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            touched("email");
          }}
          placeholder="name@example.com"
          accent="students"
          keyboardType="email-address"
          autoCapitalize="none"
          maxLength={255}
          error={errors.email}
        />
        <PhoneField
          label={t("phoneOptional")}
          prefix={phone.prefix}
          number={phone.number}
          onChange={(value) => {
            setPhone(value);
            touched("phoneNumber");
          }}
          prefixes={PHONE_PREFIXES}
          placeholder="600 123 456"
          accent="students"
          error={errors.phoneNumber}
        />

        {editing ? null : (
          <XStack
            alignItems="flex-start"
            gap={12}
            paddingVertical={14}
            paddingHorizontal={16}
            borderRadius="$card"
            borderWidth={1}
            borderColor="$neutralCardBorder"
            backgroundColor="$neutralCard"
          >
            <ListIcon icon={Info} size={36} />
            <YStack flex={1} gap={3}>
              <Text fontSize={14} fontWeight="$rowTitle" color="$neutralText">
                {t("studentNoAccountTitle")}
              </Text>
              <Text fontSize={13} fontWeight="$secondary" lineHeight={19} color="$neutralMuted">
                {t("studentNoAccountHint")}
              </Text>
            </YStack>
          </XStack>
        )}
      </YStack>
    </SubScreenPage>
  );
};
