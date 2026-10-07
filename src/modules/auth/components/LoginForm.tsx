import { AlertBanner, PrimaryButton, TextField } from "@/core/components";
import { neutral } from "@/core/theme/tokens";
import type { AuthError } from "@/store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import type { LoginFormData } from "../validation/loginSchema";

/** Neutral gradient of the auth screens' primary button (#F4F6FA → #CBD5E1, dark label). */
export const AUTH_BUTTON_COLORS = { from: neutral.text, to: neutral.tint, text: neutral.page };

const errorTitle = (error: AuthError): string => {
  switch (error.code) {
    case "invalid_credentials":
      return t("authWrongCredentials");
    case "network_error":
      return t("errorNetworkError");
    case "too_many_requests":
      return t("errorTooManyRequests");
    default:
      return t("errorUnknown");
  }
};

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  isLoading: boolean;
  error?: AuthError | null;
  onDismissError?: () => void;
}

/**
 * Sign in form (sign in board): error alert, EMAIL, PASSWORD with the eye
 * toggle, "Forgot password?" on the right, neutral Sign in button.
 */
export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading, error, onDismissError }) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const wrongCredentials = error?.code === "invalid_credentials";

  const handleSubmit = () => onSubmit({ email: email.trim(), password });

  return (
    <YStack gap={18}>
      {error ? (
        <AlertBanner
          title={errorTitle(error)}
          message={wrongCredentials ? t("authWrongCredentialsHint") : error.message}
          onDismiss={onDismissError}
        />
      ) : null}

      <TextField
        size="large"
        label={t("email")}
        value={email}
        onChangeText={setEmail}
        disabled={isLoading}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
      />

      <TextField
        size="large"
        secure
        label={t("password")}
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        invalid={wrongCredentials}
        disabled={isLoading}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />

      <XStack
        role="link"
        aria-label={t("authForgotPassword")}
        onPress={() => router.push("/auth/forgot-password" as any)}
        pressStyle={{ opacity: 0.7 }}
        alignSelf="flex-end"
        height={36}
        marginTop={-8}
        alignItems="center"
      >
        <Text fontSize={14} fontWeight="$button" color="$neutralText">
          {t("authForgotPassword")}
        </Text>
      </XStack>

      <PrimaryButton label={t("authSignIn")} onPress={handleSubmit} colors={AUTH_BUTTON_COLORS} loading={isLoading} />
    </YStack>
  );
};
