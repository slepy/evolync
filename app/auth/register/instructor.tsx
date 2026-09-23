import { GoogleAuthButton } from "@/modules/auth/components/GoogleAuthButton";
import { LoginPrompt } from "@/modules/auth/components/LoginPrompt";
import { RegisterInstructorForm } from "@/modules/auth/components/RegisterInstructorForm";
import { AppLogo } from "@/modules/core/components/AppLogo";
import { Divider } from "@/modules/core/components/Divider";
import { useRouter } from "expo-router";
import React from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Text, YStack } from "tamagui";

// ============================================================================
// RegisterInstructorScreen Component
// ============================================================================

/**
 * Registration screen for instructors.
 * Allows creation of a new organization with the first school.
 * After successful registration, user is automatically logged in and redirected to dashboard.
 */
export default function RegisterInstructorScreen() {
  const router = useRouter();

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  const handleGoogleRegister = async () => {
    // TODO: Implement Google OAuth registration flow for instructors
    console.log("Google registration flow");
  };

  const handleNavigateToLogin = () => {
    router.push("/auth/login" as any);
  };

  // ==========================================================================
  // Main Render
  // ==========================================================================

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <YStack
            flex={1}
            justifyContent="center"
            maxWidth={420}
            width="100%"
            alignSelf="center"
          >
            {/* Logo */}
            <AppLogo />

            {/* Header Text */}
            <YStack gap="$2" marginBottom="$4">
              <Text
                fontSize="$8"
                fontWeight="700"
                color="$blackInk"
                textAlign="center"
              >
                {t("createOrganization")}
              </Text>
              <Text
                fontSize="$5"
                fontWeight="500"
                color="$softGray"
                textAlign="center"
              >
                {t("createOrganizationDescription")}
              </Text>
            </YStack>

            {/* Registration Form */}
            <RegisterInstructorForm />

            {/* Divider */}
            {/*  <Divider /> */}

            {/* Google Auth Button */}
            {/* <GoogleAuthButton
              onPress={handleGoogleRegister}
              isLoading={false}
              disabled={false}
            /> */}

            {/* Login Prompt */}
            <LoginPrompt onNavigate={handleNavigateToLogin} />
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
