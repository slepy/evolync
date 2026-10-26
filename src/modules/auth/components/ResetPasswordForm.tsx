import { AlertBanner, AuthIntro, AuthPage, PrimaryButton } from "@/core/components";
import type { AuthError } from "@/store";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useRevalidateOnLanguageChange } from "@/core/hooks";
import { Text, XStack } from "tamagui";
import { OTP_MAX_LENGTH, OTP_MIN_LENGTH, resetPasswordSchema, type ResetPasswordFormValues } from "../validation/resetPasswordSchema";
import { CodeField } from "./CodeField";
import { AUTH_BUTTON_COLORS } from "./LoginForm";
import { PasswordFields } from "./PasswordFields";

interface ResetPasswordFormProps {
  /** Where the code went; shown in "We sent a code to …". */
  email: string;
  onSubmit: (code: string, password: string) => Promise<void>;
  /** "Send a new code" and the back button. */
  onRequestNewCode: () => void;
  isLoading: boolean;
  error?: AuthError | null;
  onDismissError?: () => void;
}

/**
 * New password screen (board): "Check your inbox", CODE FROM EMAIL, NEW
 * PASSWORD + rules, CONFIRM NEW PASSWORD, "Send a new code", Save pinned.
 */
export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  email,
  onSubmit,
  onRequestNewCode,
  isLoading,
  error,
  onDismissError,
}) => {
  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: { code: "", password: "", confirmPassword: "" },
  });
  useRevalidateOnLanguageChange(errors, trigger);

  const handleSave = handleSubmit((data) => onSubmit(data.code, data.password));

  return (
    <AuthPage
      title={t("authNewPasswordTitle")}
      onBack={onRequestNewCode}
      footer={<PrimaryButton label={t("save")} colors={AUTH_BUTTON_COLORS} onPress={handleSave} loading={isLoading} />}
    >
      <AuthIntro
        title={t("authCheckInbox")}
        description={
          email ? (
            <>
              {t("authCodeSentTo")}{" "}
              <Text fontWeight="$button" color="$neutralText">
                {email}
              </Text>
              .
            </>
          ) : (
            t("resetPasswordDescription")
          )
        }
      />

      {error ? <AlertBanner title={error.message} onDismiss={onDismissError} /> : null}

      <Controller
        control={control}
        name="code"
        render={({ field }) => (
          <CodeField
            label={t("authCodeFromEmail")}
            value={field.value}
            onChangeText={field.onChange}
            maxLength={OTP_MAX_LENGTH}
            hint={t("authCodeHint", { min: OTP_MIN_LENGTH, max: OTP_MAX_LENGTH })}
            error={errors.code?.message}
            disabled={isLoading}
          />
        )}
      />

      <PasswordFields
        control={control}
        errors={errors}
        password="password"
        confirm="confirmPassword"
        passwordLabel={t("newPassword")}
        confirmLabel={t("confirmNewPassword")}
        disabled={isLoading}
      />

      <XStack
        role="link"
        aria-label={t("authSendNewCode")}
        onPress={onRequestNewCode}
        pressStyle={{ opacity: 0.7 }}
        alignSelf="center"
        height={44}
        paddingHorizontal={12}
        alignItems="center"
      >
        <Text fontSize={14} fontWeight="$button" color="$neutralText">
          {t("authSendNewCode")}
        </Text>
      </XStack>
    </AuthPage>
  );
};
