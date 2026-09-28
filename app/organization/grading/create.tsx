import {
  Header,
  HeaderTitle,
  SubmitComponent,
} from "@/modules/core/components";
import { useDirtyFlag } from "@/modules/core/hooks";
import { useStore } from "@/store";
import { addRank } from "@/modules/grading/services/gradingService";
import { createRankSchema } from "@/modules/grading/validation";
import { ColorPickerSheet } from "@/modules/grading/components";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, Text, YStack } from "tamagui";

export default function CreateGradingRankRoute() {
  useRequireOrganizationOwner();
  const router = useRouter();
  const { organization } = useStore();
  const [name, setName] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isDirty, markDirty } = useDirtyFlag();

  const handleNameChange = (value: string) => {
    setName(value);
    setErrorText(null);
    if (value.trim()) markDirty();
  };

  const handleSelectColor = (hex: string) => {
    setColor(hex);
    markDirty();
  };

  const handleSave = async () => {
    if (!organization) return;

    const result = createRankSchema.safeParse({
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
      await addRank(organization.id, result.data);
      router.back();
    } catch (err) {
      setErrorText(
        t(err instanceof Error ? err.message : "errorUnknown"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("gradingAddRank")} />}
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
    </SafeAreaView>
  );
}
