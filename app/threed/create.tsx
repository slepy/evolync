import {
  ErrorBanner,
  Header,
  HeaderTitle,
  SubmitButton,
  TextInput,
} from "@/modules/core/components";
import { createSequence } from "@/modules/threed/services";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, YStack } from "tamagui";

export default function CreateSequenceScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim()) return;

    try {
      setIsCreating(true);
      setError(null);

      const sequence = await createSequence({
        title: title.trim(),
        description: description.trim() || undefined,
      });

      router.replace(`/threed/${sequence.id}` as any);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("errorCreateFailed")
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <YStack flex={1}>
          <Header
            onBack={() => router.back()}
            centerContent={
              <HeaderTitle text={t("threedCreateSequence")} />
            }
            rightContent={
              <SubmitButton
                onPress={handleCreate}
                isLoading={isCreating}
                disabled={!title.trim()}
              />
            }
          />

          {error && (
            <ErrorBanner
              title={error}
              onDismiss={() => setError(null)}
            />
          )}

          <ScrollView flex={1} padding="$4">
            <YStack gap="$4">
              <TextInput
                label={t("fieldName")}
                value={title}
                onChangeText={setTitle}
                placeholder={t("threedSequenceTitlePlaceholder")}
                autoFocus
              />

              <TextInput
                label={t("fieldDescription")}
                value={description}
                onChangeText={setDescription}
                placeholder={t("threedSequenceDescriptionPlaceholder")}
              />
            </YStack>
          </ScrollView>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
