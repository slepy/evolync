import { Ticket } from 'lucide-react-native';
import React from 'react';
import { Text, View, XStack, YStack } from 'tamagui';
import { contextColors } from "@/core/theme/tokens";

const student = contextColors.student;

/** "Next: your school code" card: what happens after the account exists. */
export const NextStepCard: React.FC = () => (
  <XStack
    alignItems="flex-start"
    gap={12}
    paddingVertical={14}
    paddingHorizontal={16}
    borderRadius="$card"
    backgroundColor="$neutralCard"
    borderWidth={1}
    borderColor="$neutralCardBorder"
  >
    <View width={36} height={36} borderRadius={12} backgroundColor={student.fill} alignItems="center" justifyContent="center" flexShrink={0}>
      <Ticket size={18} color={student.label} strokeWidth={2} />
    </View>
    <YStack flex={1} gap={3}>
      <Text fontSize={14} fontWeight="$button" color="$neutralText">
        {t('authNextSchoolCode')}
      </Text>
      <Text fontSize={13} lineHeight={19} fontWeight="$secondary" color="$neutralMuted">
        {t('authNextSchoolCodeHint')}
      </Text>
    </YStack>
  </XStack>
);
