import {
  ErrorBanner,
  Header,
  HeaderTitle,
  SubmitButton,
  TextInput,
} from "@/modules/core/components";
import { createSequence } from "@/modules/threed/services";
import { THREED_DESCRIPTION_MAX, THREED_TITLE_MAX } from "@/modules/threed/validation";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, YStack } from "tamagui";

export default function CreateSequenceScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const handleCreate = async () => {
    if (!title.trim()) return;

    try {
      setIsCreating(true);
      setError(null);

      const sequence = await createSequence({
        title: title.trim(),
        description: description.trim() || undefined,
      });

      router.replace(`/techniques/threed/${sequence.id}` as any);
    } catch (err) {
      console.error("[CreateSequenceScreen] create:", err);
      setError(t(err instanceof Error ? err.message : "errorCreateFailed"));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
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
                maxLength={THREED_TITLE_MAX}
                autoFocus
              />

              <TextInput
                label={t("fieldDescription")}
                value={description}
                onChangeText={setDescription}
                placeholder={t("threedSequenceDescriptionPlaceholder")}
                maxLength={THREED_DESCRIPTION_MAX}
              />
            </YStack>
          </ScrollView>
        </YStack>
      </KeyboardAvoidingView>
    </View>
  );
}
