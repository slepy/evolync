import SchoolMember from "@/database/models/SchoolMember";
import { Header, HeaderTitle } from "@/modules/core/components";
import { LoadingScreen } from "@/modules/core/components/LoadingScreen";
import { OptionsSheet } from "@/modules/core/components/OptionsSheet";
import { ActiveInvites } from "@/modules/school/components";
import { SchoolJoinRequestRepository } from "@/modules/school/repositories/schoolJoinRequestRepository";
import { JoinRequestsTab, StudentCard } from "@/modules/students/components";
import { StudentRepository } from "@/modules/students/repositories";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Plus, QrCode } from "lucide-react-native";
import React, { useEffect, useState, useCallback } from "react";
import { Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Text, XStack, YStack } from "tamagui";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";

type Tab = "students" | "requests";

export default function StudentsListScreen() {
  useRequireOrganizationOwner();
  const { schoolId, tab } = useLocalSearchParams<{ schoolId: string; tab?: string }>();
  const [students, setStudents] = useState<SchoolMember[]>([]);
  const [requestsCount, setRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  // `?tab=requests` deep-links straight to join requests (e.g. from a notification).
  const [activeTab, setActiveTab] = useState<Tab>(
    tab === "requests" ? "requests" : "students",
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((prev) => prev + 1);
    }, []),
  );

  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    const sub = StudentRepository.observeBySchoolId(schoolId).subscribe({
      next: (result: SchoolMember[]) => {
        setStudents(result);
        setLoading(false);
      },
      error: (error: Error) => {
        console.error("Error observing students:", error);
        setLoading(false);
      },
    });

    return () => sub.unsubscribe();
  }, [schoolId, refreshKey]);

  useEffect(() => {
    if (!schoolId) return;
    const sub = SchoolJoinRequestRepository.observeCountBySchoolId(
      schoolId,
    ).subscribe({
      next: (count) => setRequestsCount(count),
      error: (err) =>
        console.error("[students/index] requests count error:", err),
    });
    return () => sub.unsubscribe();
  }, [schoolId]);

  const handleStudentPress = (studentId: string) => {
    router.push(`/school/${schoolId}/students/${studentId}`);
  };

  const handleAddStudent = () => {
    router.push(`/school/${schoolId}/students/create`);
  };

  const handleGenerateInvite = () => {
    router.push(`/school/${schoolId}/students/generate-invite`);
  };

  const fabOptions = [
    {
      id: "add_student",
      label: t("dashboardAddStudent"),
      icon: Plus,
      iconColor: "$blue11",
      iconBackground: "$blue3",
      onPress: handleAddStudent,
    },
    {
      id: "generate_code",
      label: t("dashboardGenerateCode"),
      icon: QrCode,
      iconColor: "$jadeGreen",
      iconBackground: "$successSurface",
      onPress: handleGenerateInvite,
    },
  ];

  if (!schoolId) {
    return (
      <View style={{ flex: 1 }}>
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Text color="$textPrimary">{t("errorNoSchool")}</Text>
        </YStack>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("studentsTitle")} />}
      />
      <ActiveInvites schoolId={schoolId} />

      {/* Tab selector */}
      <XStack
        paddingHorizontal="$3"
        paddingTop="$2"
        gap="$2"
        maxWidth={500}
        width="100%"
        alignSelf="center"
      >
        <Button
          flex={1}
          size="$2"
          backgroundColor={
            activeTab === "students" ? "$blue3" : "$fillSubtle"
          }
          pressStyle={{
            scale: 0.95,
            backgroundColor:
              activeTab === "students" ? "$blue3" : "$fillSubtle",
          }}
          onPress={() => setActiveTab("students")}
        >
          <Text
            color={activeTab === "students" ? "$blue11" : "$textMuted"}
            fontWeight="600"
          >
            {t("studentsTitle")}
          </Text>
        </Button>

        <Button
          flex={1}
          size="$2"
          backgroundColor={
            activeTab === "requests" ? "$blue3" : "$fillSubtle"
          }
          pressStyle={{
            scale: 0.95,
            backgroundColor:
              activeTab === "requests" ? "$blue3" : "$fillSubtle",
          }}
          onPress={() => setActiveTab("requests")}
        >
          <XStack gap="$2" alignItems="center">
            <Text
              color={activeTab === "requests" ? "$blue11" : "$textMuted"}
              fontWeight="600"
            >
              {t("joinRequests")}
            </Text>
            {requestsCount > 0 && (
              <YStack
                backgroundColor="$imperialRed"
                borderRadius="$10"
                paddingHorizontal="$2"
                paddingVertical="$1"
                minWidth={20}
                alignItems="center"
              >
                <Text fontSize="$2" color="$pearlWhite" fontWeight="700">
                  {requestsCount}
                </Text>
              </YStack>
            )}
          </XStack>
        </Button>
      </XStack>

      <YStack
        flex={1}
        maxWidth={500}
        width="100%"
        alignSelf="center"
        paddingTop="$2"
      >
        {activeTab === "students" ? (
          loading ? (
            <LoadingScreen />
          ) : (
            <ScrollView
              contentContainerStyle={{ paddingBottom: 20 }}
              style={{ flex: 1 }}
            >
              {students.length === 0 ? (
                <YStack gap="$2" alignItems="center" marginTop="$10">
                  <Text color="$textBody" textAlign="center">
                    {t("emptyNoStudents")}
                  </Text>
                </YStack>
              ) : (
                students.map((item) => (
                  <StudentCard
                    key={item.id}
                    displayName={item.displayName ?? ""}
                    email={item.email}
                    status={item.status}
                    userId={item.userId}
                    rankId={item.currentRankId}
                    avatarUrl={item.avatarUrl}
                    onPress={() => handleStudentPress(item.id)}
                  />
                ))
              )}
            </ScrollView>
          )
        ) : (
          <JoinRequestsTab schoolId={schoolId} />
        )}
      </YStack>

      <OptionsSheet
        open={isOpen}
        onOpenChange={setIsOpen}
        options={fabOptions}
        snapPoint={25}
        fab={{ bottom: Platform.OS === "ios" ? 90 : 80, right: 20 }}
      />
    </View>
  );
}
