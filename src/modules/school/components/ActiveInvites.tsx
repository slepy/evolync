import SchoolInvite from "@/database/models/SchoolInvite";
import { BaseCard, CardInfo } from "@/modules/core/components";
import { SchoolInviteRepository } from "@/modules/school/repositories/schoolInviteRepository";
import { withObservables } from "@nozbe/watermelondb/react";
import * as Clipboard from "expo-clipboard";
import { Copy } from "lucide-react-native";
import React from "react";
import { Alert } from "react-native";
import { XStack, YStack, useTheme } from "tamagui";
import type { ColorTokens } from "tamagui";

const ActiveInvites = ({ invites }: { invites: SchoolInvite[] }) => {
  const theme = useTheme();
  const iconColor: ColorTokens = "$blue11";
  const resolvedIconColor = iconColor.startsWith("$")
    ? theme[iconColor.slice(1)]?.val || iconColor
    : iconColor;

  if (invites.length === 0) return null;

  const handleCopy = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
      Alert.alert(t("inviteCopiedTitle"), t("inviteCopiedMessage", { code }));
    } catch (error) {
      console.warn("Clipboard error:", error);
      Alert.alert(t("errorUnknown"), t("inviteClipboardError"));
    }
  };

  return (
    <YStack paddingTop="$3" gap="$2">
      {invites.map((invite) => (
        <BaseCard
          key={invite.id}
          onPress={() => handleCopy(invite.code)}
          backgroundColor="$blue3"
          borderColor="$borderColor"
        >
          <XStack
            alignItems="center"
            justifyContent="space-between"
            pointerEvents="none"
          >
            {/* Content */}
            <CardInfo
              displayName={invite.code}
              subtitle={t("inviteExpiresAt", {
                date: new Date(invite.expiresAt).toLocaleDateString(),
              })}
            />

            {/* Icon */}
            <Copy size={20} color={resolvedIconColor} pointerEvents="none" />
          </XStack>
        </BaseCard>
      ))}
    </YStack>
  );
};

const enhance = withObservables(
  ["schoolId"],
  ({ schoolId }: { schoolId: string }) => ({
    invites: SchoolInviteRepository.observeActiveBySchoolId(schoolId),
  }),
);

export default enhance(ActiveInvites);
