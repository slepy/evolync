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
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, Text, YStack, useTheme } from "tamagui";
import { GradingRankRepository } from "../repositories";
import { deleteRank, updateRank } from "../services/gradingService";
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
    if (value.trim() !== (initialName ?? "").trim()) markDirty();
  };

  const handleSelectColor = (hex: string) => {
    setColor(hex);
    if (hex !== initialColor) markDirty();
  };

  const handleSave = async () => {
    if (!rankId || !name.trim()) return;
    setIsLoading(true);
    try {
      await updateRank(rankId, { name: name.trim(), color: color ?? undefined });
      router.back();
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
    </SafeAreaView>
  );
};
