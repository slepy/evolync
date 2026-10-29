import { AlertBanner, AuthIntro, AuthPage, AuthPrompt, PrimaryButton, TextField } from "@/core/components";
import { neutral } from "@/core/theme/tokens";
import type { AuthError } from "@/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react-native";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useRevalidateOnLanguageChange } from "@/core/hooks";
import { View } from "tamagui";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../validation/forgotPasswordSchema";
import { AUTH_BUTTON_COLORS } from "./LoginForm";

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
  onSignIn: () => void;
  isLoading: boolean;
  error?: AuthError | null;
  onDismissError?: () => void;
}

/**
 * Forgot password screen (board): mail icon, "We’ll email you a code",
 * EMAIL, Send; "Remembered it? Sign in" at the bottom.
 */
export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSubmit, onSignIn, isLoading, error, onDismissError }) => {
  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: { email: "" },
  });
  useRevalidateOnLanguageChange(errors, trigger);

  const handleSend = handleSubmit((data) => onSubmit(data.email));

  return (
    <AuthPage
      title={t("authForgotPasswordTitle")}
      onBack={onSignIn}
      bottom={<AuthPrompt text={t("authRememberedIt")} action={t("authSignIn")} onPress={onSignIn} />}
    >
      <AuthIntro
        icon={
          <View width={56} height={56} borderRadius={18} backgroundColor="$neutralTintFill" alignItems="center" justifyContent="center">
            <Mail size={26} color={neutral.tint} strokeWidth={2} />
          </View>
        }
        title={t("authForgotPasswordHeading")}
        description={t("authForgotPasswordDescription")}
      />

      {error ? <AlertBanner title={t("errorPasswordResetFailed")} message={error.message} onDismiss={onDismissError} /> : null}

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            size="large"
            label={t("email")}
            value={field.value}
            onChangeText={(v) => field.onChange(v.trim())}
            error={errors.email?.message}
            disabled={isLoading}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
        )}
      />

      <PrimaryButton label={t("authSend")} colors={AUTH_BUTTON_COLORS} onPress={handleSend} loading={isLoading} />
    </AuthPage>
  );
};
