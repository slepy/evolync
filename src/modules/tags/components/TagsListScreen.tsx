import {
  BaseCard,
  CardInfo,
  Header,
  HeaderTitle,
  LoadingScreen,
  OptionsSheet,
} from "@/modules/core/components";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tag } from "lucide-react-native";
import { Text, XStack, YStack } from "tamagui";
import { Thumbnail } from "@/modules/core/components";
import { useTags } from "../hooks";

export const TagsListScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tags, isLoading } = useTags();

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("tagsPicker")} />}
      />

      <FlatList
        data={tags}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => (
          <BaseCard onPress={() => router.push(`/tags/${item.id}/edit`)}>
            <XStack gap="$3" alignItems="center">
              <Thumbnail
                icon={<Tag />}
                borderColor="$chineseCoral"
                backgroundColor="$chineseCoralLighter"
              />
              <CardInfo displayName={item.name} />
            </XStack>
          </BaseCard>
        )}
        ListEmptyComponent={
          <YStack
            alignItems="center"
            paddingVertical="$8"
            paddingHorizontal="$6"
          >
            <Text fontSize="$4" color="$softGrayDark" textAlign="center">
              {t("tagsEmpty")}
            </Text>
          </YStack>
        }
      />

      <OptionsSheet fab={{}} action={() => router.push("/tags/create")} />
    </View>
  );
};
