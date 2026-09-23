import {
  type MemberStatus,
  MemberStatus as MemberStatusEnum,
  getDisplayStatus,
} from "@/modules/students/types";

import { BaseCard, CardInfo, Thumbnail } from "@/modules/core/components";
import { useRankById } from "@/modules/grading/hooks/useRankById";
import React from "react";
import type { ColorTokens } from "tamagui";
import { Text, XStack, YStack } from "tamagui";

// ============================================================================
// Types
// ============================================================================

interface StudentCardProps {
  displayName: string;
  email?: string | null;
  status: MemberStatus;
  userId?: string | null;
  rankId?: string | null;
  avatarUrl?: string | null;
  onPress: () => void;
}

interface StatusConfig {
  color: ColorTokens;
  bg: ColorTokens;
  label: string;
}

// ============================================================================
// Status Badge Component
// ============================================================================

export const StatusBadge: React.FC<{ status: MemberStatus }> = ({ status }) => {
  const statusConfigMap: Record<MemberStatus, StatusConfig> = {
    [MemberStatusEnum.ACTIVE]: {
      color: "$jadeGreen",
      bg: "$jadeGreenLighter",
      label: t("statusActive"),
    },
    [MemberStatusEnum.PENDING]: {
      color: "$orange10",
      bg: "$orange3",
      label: t("statusPending"),
    },
    [MemberStatusEnum.ARCHIVED]: {
      color: "$softGrayDark",
      bg: "$softGrayLight",
      label: t("statusArchived"),
    },
    [MemberStatusEnum.REJECTED]: {
      color: "$red10",
      bg: "$red3",
      label: t("statusRejected"),
    },
    [MemberStatusEnum.OFFLINE]: {
      color: "$purple10",
      bg: "$purple3",
      label: t("statusOffline"),
    },
  };

  const config = statusConfigMap[status] ?? {
    color: "$softGrayDark",
    bg: "$softGrayLight",
    label: status,
  };

  return (
    <XStack
      backgroundColor={config.bg}
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$2"
    >
      <Text fontSize="$2" color={config.color} fontWeight="600">
        {config.label}
      </Text>
    </XStack>
  );
};

// ============================================================================
// StudentCard Component
// ============================================================================

export const StudentCard: React.FC<StudentCardProps> = ({
  displayName,
  email,
  status,
  userId,
  rankId,
  avatarUrl,
  onPress,
}) => {
  const rank = useRankById(rankId);
  const iconColor: ColorTokens = "$blue11";
  const bgColor: ColorTokens = "$blue3";

  const displayStatus = getDisplayStatus(status, userId);

  return (
    <BaseCard onPress={onPress}>
      <XStack gap="$3" alignItems="center">
        <Thumbnail
          backgroundColor={bgColor}
          borderColor={iconColor}
          rankColor={rank?.color}
          imageUrl={avatarUrl}
        />

        <CardInfo displayName={displayName} subtitle={email} />

        <YStack alignItems="flex-end">
          <StatusBadge status={displayStatus} />
        </YStack>
      </XStack>
    </BaseCard>
  );
};
