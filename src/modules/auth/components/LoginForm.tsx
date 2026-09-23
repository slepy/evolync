import { SubmitButton } from "@/modules/core/components";
import { Eye, EyeOff } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput } from "react-native";
import { Button, Label, Text, YStack } from "tamagui";
import type { FormErrors, LoginFormData } from "../validation/loginSchema";

// ============================================================================
// Input Styles
// ============================================================================

const inputStyles = StyleSheet.create({
  base: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    color: "#1A1A2E",
    borderColor: "#E2E8F0",
  },
  error: {
    borderColor: "#DC2626",
  },
  passwordInput: {
    paddingRight: 48,
  },
});

// ============================================================================
// Types
// ============================================================================

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  isLoading: boolean;
  errors?: FormErrors;
}

// ============================================================================
// LoginForm Component
// ============================================================================

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading,
  errors,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleFormSubmit = async () => {
    await onSubmit({ email, password });
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <YStack gap="$3">
      {/* Email Input */}
      <YStack gap="$0.5">
        <Label htmlFor="email" fontSize="$4" fontWeight="600" color="$softGray">
          {t("email")}
        </Label>
        <TextInput
          placeholder={t("email")}
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          placeholderTextColor="#94A3B8"
          style={[inputStyles.base, errors?.email && inputStyles.error]}
        />
        {errors?.email && (
          <Text color="$imperialRed" fontSize="$3" fontWeight="500">
            {errors.email}
          </Text>
        )}
      </YStack>

      {/* Password Input */}
      <YStack gap="$0.5">
        <Label
          htmlFor="password"
          fontSize="$4"
          fontWeight="600"
          color="$softGray"
        >
          {t("password")}
        </Label>
        <YStack position="relative" justifyContent="center">
          <TextInput
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            textContentType="password"
            autoComplete="password"
            placeholderTextColor="#94A3B8"
            style={[
              inputStyles.base,
              inputStyles.passwordInput,
              errors?.password && inputStyles.error,
            ]}
          />
          <Pressable
            onPress={togglePasswordVisibility}
            style={{
              position: "absolute",
              right: 12,
              padding: 8,
            }}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff size={22} color={isLoading ? "#94A3B8" : "#64748B"} />
            ) : (
              <Eye size={22} color={isLoading ? "#94A3B8" : "#64748B"} />
            )}
          </Pressable>
        </YStack>
        {errors?.password && (
          <Text color="$imperialRed" fontSize="$3" fontWeight="500">
            {errors.password}
          </Text>
        )}
      </YStack>

      {/* Forgot Password Link */}
      <Button
        chromeless
        alignSelf="flex-end"
        size="$3"
        color="$chineseGold"
        fontWeight="600"
        marginTop="$-3"
        hoverStyle={{
          backgroundColor: "rgba(245, 158, 11, 0.1)",
        }}
        pressStyle={{
          backgroundColor: "rgba(245, 158, 11, 0.15)",
        }}
        onPress={() => {
          // TODO: Navigate to forgot password screen
          console.log("Navigate to forgot password");
        }}
      >
        {t("forgotPassword")}
      </Button>

      <SubmitButton
        onPress={handleFormSubmit}
        isLoading={isLoading}
        disabled={isLoading}
      />
    </YStack>
  );
};
