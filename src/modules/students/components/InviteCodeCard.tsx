import { ListIcon, withAlpha } from "@/core/components";
import { moduleAccents } from "@/core/theme/tokens";
import { Copy, QrCode } from "lucide-react-native";
import React from "react";
import { Text, XStack, YStack } from "tamagui";

interface InviteCodeCardProps {
  code: string;
  /** "Expires 18 Oct" */
  expiresLabel: string;
  onCopy: () => void;
}

/** Active invite code above the students (16A): dashed orange card, the whole card copies the code. */
export const InviteCodeCard: React.FC<InviteCodeCardProps> = ({ code, expiresLabel, onCopy }) => {
  const accent = moduleAccents.students;

  return (
    <XStack
      role="button"
      aria-label={t("inviteCopyCode", { code })}
      onPress={onCopy}
      pressStyle={{ opacity: 0.85 }}
      alignItems="center"
      gap={14}
      paddingVertical={14}
      paddingHorizontal={16}
      borderRadius="$card"
      borderWidth={1}
      borderStyle="dashed"
      borderColor={withAlpha(accent.tint, 0.5)}
      backgroundColor="$neutralCard"
    >
      <ListIcon icon={QrCode} accent="students" size={44} />
      <YStack flex={1} minWidth={0} gap={3}>
        <Text fontSize={10.5} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted">
          {t("inviteCodeLabel")}
        </Text>
        <Text fontSize={19} fontWeight="$section" letterSpacing={1.5} color="$neutralText" numberOfLines={1}>
          {code}
        </Text>
        <Text fontSize={12.5} fontWeight="$secondary" color="$neutralMuted" numberOfLines={1}>
          {expiresLabel}
        </Text>
      </YStack>
      <XStack alignItems="center" gap={6} height={36} paddingHorizontal={12} borderRadius={18} backgroundColor={accent.fill} flexShrink={0}>
        <Copy size={15} color={accent.tint} strokeWidth={2.4} />
        <Text fontSize={13} fontWeight="$button" color={accent.tint}>
          {t("copy")}
        </Text>
      </XStack>
    </XStack>
  );
};
