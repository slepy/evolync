import { FormCard, ListCard, ListIcon, ListRow, MainNav, PhoneField, PhotoField, PrimaryButton, TabPage, TextField } from "@/core/components";
import { PHONE_PREFIXES } from "@/core/utils/phonePrefixes";
import { useDirtyFlag } from "@/core/hooks";
import { LogOut, Mail, User } from "lucide-react-native";
import React, { useState } from "react";
import { Alert } from "react-native";
import { Text, YStack } from "tamagui";
import type { ProfileValues } from "../utils/profileValues";
import { profileSchema } from "../validation/profileSchema";

interface ProfileScreenProps {
  initial: ProfileValues;
  /** Sign-in email, read-only. */
  email: string;
  /** Persists the values and returns them as saved (uploaded photo URL); a thrown error is shown above Save. */
  onSubmit: (values: ProfileValues) => Promise<ProfileValues>;
  /** Signs out of the app; asked for after a confirmation alert. */
  onSignOut: () => void;
}

type Field = "fullName" | "phone";

/**
 * Profile tab (P1 / P2), every role: Photo field as on products, Personal
 * info (FULL NAME, PHONE (OPTIONAL)) and Sign-in (locked EMAIL) cards, then
 * Log out (confirmed in an alert). After the first change Save takes the nav's
 * place until the change is saved.
 */
export const ProfileScreen: React.FC<ProfileScreenProps> = ({ initial, email, onSubmit, onSignOut }) => {
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [fullName, setFullName] = useState(initial.fullName);
  const [phone, setPhone] = useState(initial.phone);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const { isDirty, markDirty, reset } = useDirtyFlag();

  const changed = (field?: Field) => {
    markDirty();
    setSubmitError(undefined);
    if (field) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSave = async () => {
    if (isSaving) return;
    const result = profileSchema.safeParse({ full_name: fullName, avatar_url: avatarUrl, phone });
    if (!result.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of result.error.issues) {
        const field: Field = issue.path[0] === "phone" ? "phone" : "fullName";
        next[field] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setIsSaving(true);
    try {
      const saved = await onSubmit({ fullName, avatarUrl, phone });
      setAvatarUrl(saved.avatarUrl);
      reset();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t("errorSaveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const confirmSignOut = () =>
    Alert.alert(t("profileLogOutConfirmTitle"), t("profileLogOutConfirmMessage"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("profileLogOut"), style: "destructive", onPress: onSignOut },
    ]);

  return (
    <TabPage
      title={t("profile")}
      gap={16}
      nav={isDirty ? undefined : <MainNav />}
      footer={
        isDirty ? (
          <YStack gap={10}>
            {submitError ? (
              <Text fontSize={12.5} fontWeight="$secondary" color="$trashText" textAlign="center">
                {submitError}
              </Text>
            ) : null}
            <PrimaryButton label={t("save")} accent="light" onPress={handleSave} loading={isSaving} />
          </YStack>
        ) : undefined
      }
    >
      <PhotoField
        label={t("profileAvatar")}
        value={avatarUrl}
        onChange={(uri) => {
          setAvatarUrl(uri);
          changed();
        }}
        accent="light"
        disabled={isSaving}
      />

      <FormCard icon={User} accent="neutral" title={t("profilePersonalInfo")} subtitle={t("profilePersonalInfoHint")}>
        <TextField
          label={t("fullName")}
          value={fullName}
          onChangeText={(value) => {
            setFullName(value);
            changed("fullName");
          }}
          placeholder={t("fullNamePlaceholder")}
          size="large"
          accent="light"
          autoCapitalize="words"
          textContentType="name"
          maxLength={100}
          error={errors.fullName}
        />
        <PhoneField
          label={t("phoneOptional")}
          prefix={phone.prefix}
          number={phone.number}
          onChange={(value) => {
            // Picking the prefix already set is not a change.
            if (value.prefix === phone.prefix && value.number === phone.number) return;
            setPhone(value);
            changed("phone");
          }}
          prefixes={PHONE_PREFIXES}
          placeholder="600 123 456"
          size="large"
          accent="light"
          error={errors.phone}
        />
      </FormCard>

      <FormCard icon={Mail} accent="neutral" title={t("profileSignIn")} subtitle={t("profileSignInHint")}>
        <TextField label={t("email")} value={email} onChangeText={() => {}} size="large" locked hint={t("profileEmailLocked")} />
      </FormCard>

      <ListCard role="list" aria-label={t("profileLogOut")}>
        <ListRow
          role="button"
          danger
          title={t("profileLogOut")}
          subtitle={t("profileLogOutHint")}
          leading={<ListIcon icon={LogOut} accent="danger" size={44} />}
          onPress={confirmSignOut}
        />
      </ListCard>
    </TabPage>
  );
};
