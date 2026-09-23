import SchoolJoinRequest from "@/database/models/SchoolJoinRequest";
import School from "@/database/models/School";
import { database } from "@/database";
import { SchoolJoinRequestRepository } from "@/modules/school/repositories/schoolJoinRequestRepository";
import { rejectJoinRequest } from "../services";
import { JoinRequestCard } from "./JoinRequestCard";
import { ApproveJoinRequestSheet } from "./ApproveJoinRequestSheet";
import React, { useEffect, useState, useCallback } from "react";
import { Alert, ScrollView } from "react-native";
import { Text, YStack } from "tamagui";

interface JoinRequestsTabProps {
  schoolId: string;
}

export const JoinRequestsTab: React.FC<JoinRequestsTabProps> = ({ schoolId }) => {
  const [requests, setRequests] = useState<SchoolJoinRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [approveRequest, setApproveRequest] = useState<SchoolJoinRequest | null>(null);
  const [organizationId, setOrganizationId] = useState<string>("");

  useEffect(() => {
    const subscription = SchoolJoinRequestRepository.observeBySchoolId(
      schoolId,
    ).subscribe({
      next: (result) => setRequests(result),
      error: (err) => console.error("[JoinRequestsTab] observe error:", err),
    });
    return () => subscription.unsubscribe();
  }, [schoolId]);

  useEffect(() => {
    database.get<School>("schools").find(schoolId).then((school) => {
      setOrganizationId(school.organizationId);
    }).catch(console.error);
  }, [schoolId]);

  const handleApprove = useCallback((requestId: string) => {
    const req = requests.find((r) => r.id === requestId);
    if (req) setApproveRequest(req);
  }, [requests]);

  const handleReject = useCallback(async (requestId: string) => {
    Alert.alert(
      t("joinRequestRejectTitle"),
      t("joinRequestRejectMessage"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("joinRequestReject"),
          style: "destructive",
          onPress: async () => {
            setProcessingId(requestId);
            try {
              await rejectJoinRequest(requestId);
            } catch (err) {
              Alert.alert(t("error"), t("errorUpdateFailed"));
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  }, []);

  if (requests.length === 0) {
    return (
      <YStack flex={1} alignItems="center" marginTop="$10">
        <Text color="$inkBlackLight" textAlign="center">
          {t("joinRequestsEmpty")}
        </Text>
      </YStack>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} style={{ flex: 1 }}>
        {requests.map((req) => (
          <JoinRequestCard
            key={req.id}
            request={req}
            onApprove={handleApprove}
            onReject={handleReject}
            isProcessing={processingId === req.id}
          />
        ))}
      </ScrollView>

      {approveRequest && organizationId ? (
        <ApproveJoinRequestSheet
          open={approveRequest !== null}
          onOpenChange={(open) => { if (!open) setApproveRequest(null); }}
          request={approveRequest}
          schoolId={schoolId}
          organizationId={organizationId}
          onApproved={() => setApproveRequest(null)}
        />
      ) : null}
    </>
  );
};
