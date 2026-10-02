import School from "@/database/models/School";
import { Header, HeaderTitle } from "@/modules/core/components";
import { LoadingScreen } from "@/modules/core/components/LoadingScreen";
import { OptionsSheet } from "@/modules/core/components/OptionsSheet";
import { SchoolCard } from "@/modules/school/components";
import { SchoolRepository } from "@/modules/school/repositories";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";

/**
 * Schools list screen
 *
 * Route: /school
 *
 * Features:
 * - Lists all schools in the organization
 * - WatermelonDB reactive observers via repository
 * - Offline support
 * - FAB for adding new schools
 */
export default function SchoolsListScreen() {
  const { organization } = useStore();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }

    const subscription = SchoolRepository.observeByOrganizationId(
      organization.id,
    ).subscribe({
      next: (result: School[]) => {
        // Filter duplicates by id (defensive - WatermelonDB should not return duplicates but observable may emit multiple times)
        const seen = new Set<string>();
        const uniqueSchools = result.filter((school) => {
          if (seen.has(school.id)) {
            return false;
          }
          seen.add(school.id);
          return true;
        });
        setSchools(uniqueSchools);
        setLoading(false);
      },
      error: (error: Error) => {
        console.error("Error observing schools:", error);
        setLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [organization?.id]);

  const handleSchoolPress = (schoolId: string) => {
    router.push(`/school/${schoolId}/dashboard`);
  };

  const handleCreateSchool = () => {
    router.push("/school/create");
  };

  if (!organization) {
    return (
      <View style={{ flex: 1 }}>
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Text color="$textPrimary">{t("errorNoOrganization")}</Text>
        </YStack>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("schoolsTitle")} />}
      />
      <YStack
        flex={1}
        maxWidth={500}
        width="100%"
        alignSelf="center"
        paddingTop="$3"
      >
        <FlatList
          data={schools}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          style={{ flex: 1 }}
          renderItem={({ item }) => (
            <SchoolCard
              name={item.name}
              address={item.address}
              onPress={() => handleSchoolPress(item.id)}
            />
          )}
          ListEmptyComponent={
            <YStack gap="$2" alignItems="center" marginTop="$10">
              <Text color="$textBody" textAlign="center">
                {t("emptyNoSchools")}
              </Text>
            </YStack>
          }
        />
      </YStack>

      {/* FAB - Add School Button */}
      <OptionsSheet
        fab={{ bottom: Platform.OS === "ios" ? 90 : 80, right: 20 }}
        action={handleCreateSchool}
      />
    </View>
  );
}
