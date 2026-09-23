import { YStack, Text, ScrollView } from "tamagui";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView, Platform } from "react-native";
import { AppLogo } from "@/modules/core/components";
import { RegisterForm, LoginPrompt } from "@/modules/auth/components";
import { useRouter } from "expo-router";

export default function RegisterScreen() {
  const router = useRouter();

  const handleNavigateToLogin = () => {
    router.push("/auth/login" as any);
  };

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
            width="100%"
            maxWidth={420}
            alignSelf="center"
          >
            <AppLogo />

            <YStack gap="$2" marginBottom="$4">
              <Text
                fontSize="$8"
                fontWeight="700"
                color="$blackInk"
                textAlign="center"
              >
                {t("joinAsPractitioner")}
              </Text>
              <Text
                fontSize="$5"
                fontWeight="500"
                color="$softGray"
                textAlign="center"
              >
                {t("joinAsPractitionerDescription")}
              </Text>
            </YStack>

            <RegisterForm />

            <LoginPrompt onNavigate={handleNavigateToLogin} />
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
