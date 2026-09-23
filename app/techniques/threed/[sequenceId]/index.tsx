import { Header, HeaderTitle, LoadingScreen } from "@/modules/core/components";
import { useSequenceSteps } from "@/modules/threed/hooks";
import { deleteSequence, deleteStep } from "@/modules/threed/services";
import { SequenceRepository } from "@/modules/threed/repositories";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Edit3, Play, Trash2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { confirmDelete } from "@/modules/core/utils/confirmDelete";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Text, XStack, YStack, useTheme } from "tamagui";
import type Sequence from "@/database/models/Sequence";

export default function SequenceDetailScreen() {
  const { sequenceId } = useLocalSearchParams<{
    sequenceId: string;
  }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [sequence, setSequence] = useState<Sequence | null>(null);
  const { steps, isLoading } = useSequenceSteps(sequenceId);

  useEffect(() => {
    if (!sequenceId) return;

    SequenceRepository.findById(sequenceId).then(setSequence);
  }, [sequenceId]);

  const handleDelete = () => {
    confirmDelete(t("delete"), t("threedDeleteSequenceConfirm"), async () => {
      if (!sequenceId) return;
      await deleteSequence(sequenceId);
      router.back();
    });
  };

  if (isLoading || !sequence) {
    return <LoadingScreen />;
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <YStack flex={1}>
        <Header
          onBack={() => router.back()}
          centerContent={<HeaderTitle text={sequence.title} />}
          rightContent={
            <XStack gap="$2">
              <Button size="$3" chromeless onPress={handleDelete}>
                <Trash2
                  size={20}
                  color={theme.imperialRedDark?.val}
                  pointerEvents="none"
                />
              </Button>
            </XStack>
          }
        />

        <XStack paddingHorizontal="$4" paddingVertical="$2" gap="$3">
          <Button
            flex={1}
            theme="active"
            onPress={() =>
              router.push(`/techniques/threed/${sequenceId}/edit` as any)
            }
            icon={<Edit3 size={18} color="white" />}
          >
            {t("edit")}
          </Button>

          {steps.length > 0 && (
            <Button
              flex={1}
              variant="outlined"
              onPress={() =>
                router.push(`/techniques/threed/${sequenceId}/viewer` as any)
              }
              icon={<Play size={18} color={theme.inkBlack?.val} />}
            >
              {t("view")}
            </Button>
          )}
        </XStack>

        <YStack flex={1} paddingHorizontal="$4">
          <Text
            fontSize="$4"
            fontWeight="600"
            color="$inkBlack"
            paddingVertical="$2"
          >
            {t("threedSteps")} ({steps.length})
          </Text>

          <FlatList
            data={steps}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <XStack
                paddingVertical="$3"
                paddingHorizontal="$3"
                marginBottom="$1"
                backgroundColor="$background"
                borderRadius="$3"
                borderWidth={1}
                borderColor="$borderColor"
                alignItems="center"
                justifyContent="space-between"
              >
                <Text fontSize="$3" fontWeight="500" color="$inkBlack">
                  {t("threedStep")} {index + 1}
                </Text>
                <Button
                  size="$2"
                  chromeless
                  onPress={() =>
                    confirmDelete(
                      t("delete"),
                      t("threedDeleteStepConfirm"),
                      () => deleteStep(item.id),
                    )
                  }
                >
                  <Trash2
                    size={16}
                    color={theme.imperialRedDark?.val}
                    pointerEvents="none"
                  />
                </Button>
              </XStack>
            )}
            ListEmptyComponent={
              <Text
                textAlign="center"
                color="$softGrayDark"
                paddingVertical="$6"
              >
                {t("threedNoSteps")}
              </Text>
            }
          />
        </YStack>
      </YStack>
    </View>
  );
}
