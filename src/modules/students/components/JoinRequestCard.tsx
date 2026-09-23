import SchoolJoinRequest from "@/database/models/SchoolJoinRequest";
import {
  BaseCard,
  CardInfo,
  StatusIndicator,
  Thumbnail,
} from "@/modules/core/components";
import { Check, X } from "lucide-react-native";
import React from "react";
import { ActivityIndicator } from "react-native";
import { Button, Text, XStack, YStack } from "tamagui";

interface JoinRequestCardProps {
  request: SchoolJoinRequest;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  isProcessing?: boolean;
}

export const JoinRequestCard: React.FC<JoinRequestCardProps> = ({
  request,
  onApprove,
  onReject,
  isProcessing,
}) => {
  return (
    <BaseCard onPress={() => {}}>
      <XStack gap="$3" alignItems="center">
        <Thumbnail imageUrl={request.avatarUrl} />
        <CardInfo
          displayName={request.displayName}
          subtitle={new Date(request.createdAt).toLocaleDateString()}
        />
        {isProcessing ? (
          <ActivityIndicator size="small" />
        ) : (
          <XStack gap="$2">
            <StatusIndicator
              icon={<Check />}
              color="$jadeGreen"
              onPress={() => onApprove(request.id)}
            />
            <StatusIndicator
              icon={<X />}
              color="$imperialRedDark"
              onPress={() => onReject(request.id)}
            />
          </XStack>
        )}
      </XStack>
    </BaseCard>
  );
};
