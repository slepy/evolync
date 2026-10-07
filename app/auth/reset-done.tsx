import { AuthPage, PrimaryButton } from '@/core/components';
import { neutral, success } from '@/core/theme/tokens';
import { AUTH_BUTTON_COLORS } from '@/modules/auth/components/LoginForm';
import { Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View, YStack } from 'tamagui';

// ============================================================================
// ResetDoneScreen Component — password changed board
// ============================================================================

export default function ResetDoneScreen() {
  const router = useRouter();

  return (
    <AuthPage
      footer={
        <PrimaryButton label={t('authSignIn')} colors={AUTH_BUTTON_COLORS} onPress={() => router.replace('/auth/login' as any)} />
      }
    >
      <YStack alignItems="center" gap={18} paddingTop={140} paddingHorizontal={8}>
        <View width={108} height={108} borderRadius={54} backgroundColor={success.halo} alignItems="center" justifyContent="center">
          <View width={88} height={88} borderRadius={44} backgroundColor="$neutralPage">
            <View flex={1} borderRadius={44} backgroundColor="$syncedFill" alignItems="center" justifyContent="center">
              <Check size={40} color={neutral.synced} strokeWidth={2.6} />
            </View>
          </View>
        </View>
        <Text fontSize={26} lineHeight={31} fontWeight="$section" letterSpacing={-0.4} color="$neutralText" textAlign="center">
          {t('authPasswordChanged')}
        </Text>
        <Text fontSize={14} lineHeight={21} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
          {t('authPasswordChangedHint')}
        </Text>
      </YStack>
    </AuthPage>
  );
}
