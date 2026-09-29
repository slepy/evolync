import {
  Header,
  HeaderTitle,
  LoadingScreen,
  SubmitComponent,
} from "@/modules/core/components";
import { confirmDelete } from "@/modules/core/utils/confirmDelete";
import { useDirtyFlag } from "@/modules/core/hooks";
import { useStore } from "@/store";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Trash2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, Text, YStack, useTheme } from "tamagui";
import { GradingRankRepository } from "../repositories";
import { deleteRank, updateRank } from "../services/gradingService";
import { updateRankSchema } from "../validation";
import { ColorPickerSheet } from "./ColorPickerSheet";

export const GradingRankEditScreen: React.FC = () => {
  const router = useRouter();
  const { rankId } = useLocalSearchParams<{ rankId: string }>();
  const { organization } = useStore();
  const theme = useTheme();

  const [initialName, setInitialName] = useState<string | null>(null);
  const [initialColor, setInitialColor] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const { isDirty, markDirty } = useDirtyFlag();

  useEffect(() => {
    if (!rankId) return;
    GradingRankRepository.findById(rankId).then((rank) => {
      if (!rank) {
        router.back();
        return;
      }
      setInitialName(rank.name);
      setInitialColor(rank.color ?? null);
      setName(rank.name);
      setColor(rank.color ?? null);
    });
  }, [rankId, router]);

  const handleNameChange = (value: string) => {
    setName(value);
    setErrorText(null);
    if (value.trim() !== (initialName ?? "").trim()) markDirty();
  };

  const handleSelectColor = (hex: string) => {
    setColor(hex);
    if (hex !== initialColor) markDirty();
  };

  const handleSave = async () => {
    if (!rankId || !organization) return;

    const result = updateRankSchema.safeParse({
      name: name.trim(),
      color: color ?? undefined,
    });
    if (!result.success) {
      setErrorText(t(result.error.issues[0].message));
      return;
    }

    setIsLoading(true);
    setErrorText(null);
    try {
      await updateRank(organization.id, rankId, {
        name: result.data.name,
        color: result.data.color ?? undefined,
      });
      router.back();
    } catch (err) {
      setErrorText(t(err instanceof Error ? err.message : "errorUnknown"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!rankId || !organization) return;
    confirmDelete(t("delete"), t("gradingDeleteRankConfirm"), async () => {
      await deleteRank(organization.id, rankId);
      router.back();
    });
  };

  if (initialName === null) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("edit")} />}
        rightContent={
          <Button
            size="$3"
            chromeless
            onPress={handleDelete}
            disabled={isLoading}
          >
            <Trash2
              size={20}
              color={theme.imperialRedDark?.val}
              pointerEvents="none"
            />
          </Button>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <YStack flex={1} padding="$6" gap="$4">
          <YStack gap="$2">
            <Text fontSize="$3" color="$softGrayDark">
              {t("gradingRankNamePlaceholder")}
            </Text>
            <Input
              value={name}
              onChangeText={handleNameChange}
              placeholder={t("gradingRankNamePlaceholder")}
              autoFocus
            />
          </YStack>

          <YStack gap="$2">
            <Text fontSize="$3" color="$softGrayDark">
              {t("gradingPickColor")}
            </Text>
            <Button
              height={44}
              borderRadius="$4"
              borderWidth={1}
              borderColor="$softGrayLight"
              backgroundColor={color || "$softGrayLight"}
              pressStyle={{ scale: 0.98 }}
              onPress={() => setColorPickerOpen(true)}
            />
          </YStack>

          {errorText && (
            <Text fontSize="$3" color="$imperialRedDark">
              {errorText}
            </Text>
          )}
        </YStack>

        <ColorPickerSheet
          open={colorPickerOpen}
          onOpenChange={setColorPickerOpen}
          currentColor={color}
          onSelectColor={handleSelectColor}
        />

        {isDirty && (
          <SubmitComponent
            onPress={handleSave}
            isLoading={isLoading}
            disabled={isLoading}
            title={t("save")}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
