import { neutral } from "@/core/theme/tokens";
import { Check } from "lucide-react-native";
import React from "react";
import { Text, View, XStack } from "tamagui";
import { PASSWORD_SYMBOLS, passwordRuleStates, type PasswordRuleKey } from "../utils/passwordRules";

const ruleLabel = (key: PasswordRuleKey): string => {
  switch (key) {
    case "length":
      return t("passwordRuleLength");
    case "upper":
      return "A–Z";
    case "lower":
      return "a–z";
    case "digit":
      return "0–9";
    case "symbol":
      return t("passwordRuleSymbol", { symbols: PASSWORD_SYMBOLS });
  }
};

/**
 * Rule chips under a password field (sign up, new password): met rules are
 * green with a check, the rest outlined with an empty ring.
 */
export const PasswordRules: React.FC<{ password: string }> = ({ password }) => (
  <XStack role="list" aria-label={t("passwordRules")} flexWrap="wrap" gap={6}>
    {passwordRuleStates(password).map(({ key, met }) => (
      <XStack
        key={key}
        role="listitem"
        aria-label={`${ruleLabel(key)}, ${met ? t("passwordRuleMet") : t("passwordRuleMissing")}`}
        alignItems="center"
        gap={5}
        height={28}
        paddingLeft={8}
        paddingRight={10}
        borderRadius={14}
        backgroundColor={met ? "$syncedFill" : "transparent"}
        borderWidth={met ? 0 : 1}
        borderColor="$neutralRaisedBorder"
      >
        {met ? (
          <Check size={13} color={neutral.synced} strokeWidth={3} />
        ) : (
          <View width={9} height={9} borderRadius={5} borderWidth={1.5} borderColor="$neutralControl" />
        )}
        <Text fontSize={12.5} fontWeight="700" color={met ? "$synced" : "$neutralMuted"}>
          {ruleLabel(key)}
        </Text>
      </XStack>
    ))}
  </XStack>
);
