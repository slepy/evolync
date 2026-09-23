import {
  Header,
  HeaderTitle,
  SubmitComponent,
} from "@/modules/core/components";
import { useDirtyFlag } from "@/modules/core/hooks";
import { useStore } from "@/store";
import { addRank } from "@/modules/grading/services/gradingService";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input, Text, YStack } from "tamagui";

export default function CreateGradingRankRoute() {
  const router = useRouter();
  const { organization } = useStore();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { isDirty, markDirty } = useDirtyFlag();

  const handleNameChange = (value: string) => {
    setName(value);
    if (value.trim()) markDirty();
  };

  const handleSave = async () => {
    if (!organization || !name.trim()) return;
    setIsLoading(true);
    try {
      await addRank(organization.id, { name: name.trim() });
      router.back();
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

      <YStack flex={1} padding="$6" gap="$2">
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
