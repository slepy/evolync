import { Header, HeaderTitle, LoadingScreen, SubmitComponent } from "@/modules/core/components";
import { confirmDelete } from "@/modules/core/utils/confirmDelete";
import { useDirtyFlag } from "@/modules/core/hooks";
import { TagForm, TagFormHandle } from "@/modules/tags/components/TagForm";
import { TagRepository } from "@/modules/tags/repositories";
import { deleteTag, updateTag } from "@/modules/tags/services";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, YStack, useTheme } from "tamagui";

export default function EditTagScreen() {
  const router = useRouter();
  const { tagId } = useLocalSearchParams<{ tagId: string }>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const formRef = useRef<TagFormHandle>(null);

  const [initialName, setInitialName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isDirty, markDirty } = useDirtyFlag();

  useEffect(() => {
    if (!tagId) return;
    TagRepository.findById(tagId).then((tag) => {
      if (tag) setInitialName(tag.name);
      else router.back();
    });
  }, [tagId, router]);

  const handleSubmit = async (name: string) => {
    if (!tagId) return;
    setIsLoading(true);
    try {
      await updateTag(tagId, { name });
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!tagId) return;
    confirmDelete(t("tagsDeleteConfirm"), "", async () => {
      await deleteTag(tagId);
      router.back();
    });
  };

  if (initialName === null) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("tagsEditName")} />}
        rightContent={
          <Button size="$3" chromeless onPress={handleDelete} disabled={isLoading}>
            <Trash2 size={20} color={theme.imperialRedDark?.val} pointerEvents="none" />
          </Button>
        }
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <YStack flex={1}>
          <TagForm
            ref={formRef}
            initialName={initialName}
            onSubmit={handleSubmit}
            onDirtyChange={(dirty) => { if (dirty) markDirty(); }}
          />
          {isDirty && (
            <SubmitComponent
              onPress={() => formRef.current?.submit()}
              isLoading={isLoading}
              disabled={isLoading}
              title={t("save")}
            />
          )}
        </YStack>
      </KeyboardAvoidingView>
    </View>
  );
}
