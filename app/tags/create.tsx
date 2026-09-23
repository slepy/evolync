import { Header, HeaderTitle, SubmitComponent } from "@/modules/core/components";
import { TagForm, TagFormHandle } from "@/modules/tags/components/TagForm";
import { createTag } from "@/modules/tags/services";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, useTheme } from "tamagui";

export default function CreateTagScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const user = useStore((s) => s.user);
  const formRef = useRef<TagFormHandle>(null);
  const [isLoading, setIsLoading] = useState(false);

  const defaultColor = theme.chineseCoral?.val ?? "#F43F5E";

  const handleSubmit = async (name: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await createTag({ userId: user.id, name, color: defaultColor });
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("tagsCreateNew")} />}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <YStack flex={1}>
          <TagForm ref={formRef} onSubmit={handleSubmit} />
          <SubmitComponent
            onPress={() => formRef.current?.submit()}
            isLoading={isLoading}
            disabled={isLoading}
            title={t("save")}
          />
        </YStack>
      </KeyboardAvoidingView>
    </View>
  );
}
