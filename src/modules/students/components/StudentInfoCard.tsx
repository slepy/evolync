import { format } from "date-fns";
import {
  Award,
  BadgeCheck,
  CalendarDays,
  Mail,
  Phone,
  PhoneCall,
  MessageSquare,
  Copy,
} from "lucide-react-native";
import React, { useState } from "react";
import { Clipboard, Linking, Pressable } from "react-native";
import { Text, XStack, YStack, useTheme } from "tamagui";
import { StatusBadge } from "./StudentCard";
import { RankBadge } from "@/modules/grading/components/RankBadge";
import type { MemberStatus } from "@/modules/students/types";
import { BaseCard, OptionsSheet, Thumbnail } from "@/modules/core/components";
import type { OptionItem } from "@/modules/core/components";

// ============================================================================
// Types
// ============================================================================

interface StudentInfoCardProps {
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  status: MemberStatus;
  joinedAt?: Date | null;
  rankName?: string | null;
  rankColor?: string | null;
  onRankPress?: () => void;
}

// ============================================================================
// StudentInfoCard Component
// ============================================================================

export const StudentInfoCard: React.FC<StudentInfoCardProps> = ({
  email,
  phone,
  avatarUrl,
  status,
  joinedAt,
  rankName,
  rankColor,
  onRankPress,
}) => {
  const theme = useTheme();
  const [phoneSheetOpen, setPhoneSheetOpen] = useState(false);

  const phoneOptions: OptionItem[] = phone
    ? [
        {
          id: "call",
          label: t("callPhone"),
          icon: PhoneCall,
          iconColor: "$purple10",
          iconBackground: "$purple2",
          onPress: () => Linking.openURL(`tel:${phone}`),
        },
        {
          id: "sms",
          label: t("sendSms"),
          icon: MessageSquare,
          iconColor: "$blue11",
          iconBackground: "$blue2",
          onPress: () => Linking.openURL(`sms:${phone}`),
        },
        {
          id: "copy",
          label: t("copyPhoneNumber"),
          icon: Copy,
          iconColor: "$inkBlackLight",
          iconBackground: "$softGrayLight",
          onPress: () => Clipboard.setString(phone),
        },
        {
          id: "whatsapp",
          label: t("openWhatsApp"),
          icon: Phone,
          iconColor: "$jadeGreen",
          iconBackground: "$green2",
          onPress: () => {
            const normalized = phone.replace(/\D/g, "");
            Linking.openURL(`whatsapp://send?phone=${normalized}`);
          },
        },
      ]
    : [];

  return (
    <BaseCard onPress={() => {}} overflow="hidden">
      <XStack
        padding="$3"
        gap="$3"
        alignItems="center"
        justifyContent="space-between"
      >
        <Thumbnail
          size={100}
          iconSize={50}
          imageUrl={avatarUrl}
          rankColor={rankColor}
          borderColor="white"
          backgroundColor="$softGrayLighter"
        />

        {/* Info section */}
        <YStack gap="$2">
          {/* status */}
          <XStack alignItems="center" gap="$2.5">
            <BadgeCheck size={16} color={theme.softGrayDark?.val} />
            <StatusBadge status={status} />
          </XStack>
          {/* Email */}
          <XStack alignItems="center" gap="$2.5">
            <Mail size={16} color={theme.softGrayDark?.val} />
            <Text color="$softGrayDark" fontSize="$3" fontWeight="500" flex={1}>
              {email}
            </Text>
          </XStack>
          {/* Phone */}
          <Pressable
            onPress={phone ? () => setPhoneSheetOpen(true) : undefined}
            disabled={!phone}
          >
            <XStack alignItems="center" gap="$2.5">
              <Phone
                size={16}
                color={phone ? theme.purple10?.val : theme.softGrayDark?.val}
              />
              <Text
                color={phone ? "$purple10" : "$softGrayDark"}
                fontSize="$3"
                fontWeight="500"
                flex={1}
                textDecorationLine={phone ? "underline" : "none"}
              >
                {phone ?? t("noPhone")}
              </Text>
            </XStack>
          </Pressable>

          {/* Joined Date */}
          {joinedAt && (
            <XStack alignItems="center" gap="$2.5">
              <CalendarDays size={16} color={theme.softGrayDark?.val} />
              <Text color="$softGrayDark" fontSize="$3">
                {t("fieldJoinedAt")} · {format(joinedAt, "d MMMM yyyy")}
              </Text>
            </XStack>
          )}
          {/* rank */}
          <XStack alignItems="center" gap="$2.5">
            <Award size={16} color={theme.softGrayDark?.val} />
            <Pressable onPress={onRankPress} disabled={!onRankPress}>
              <RankBadge name={rankName} color={rankColor} />
            </Pressable>
          </XStack>
        </YStack>
      </XStack>

      <OptionsSheet
        open={phoneSheetOpen}
        onOpenChange={setPhoneSheetOpen}
        options={phoneOptions}
        snapPoint={50}
        zIndex={300}
      />
    </BaseCard>
  );
};
