import { ForgotPasswordForm } from '@/modules/auth/components/ForgotPasswordForm';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { AppLogo } from '@/modules/core/components/AppLogo';
import { ErrorBanner } from '@/modules/core/components/ErrorBanner';
import { useRouter } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ScrollView, Text, YStack } from 'tamagui';

// ============================================================================
// ForgotPasswordScreen Component
// ============================================================================

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { isLoading, error, sendPasswordResetEmail, clearError } = useAuth();

  const handleSubmit = async (email: string) => {
    clearError();
    const success = await sendPasswordResetEmail(email);
    if (success) {
      router.replace({
        pathname: '/auth/reset-password' as any,
        params: { email },
      });
    }
  };

  const handleBackToLogin = () => {
    router.replace('/auth/login' as any);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <YStack flex={1} justifyContent="center" maxWidth={420} width="100%" alignSelf="center" gap="$4">
            <AppLogo />

            <YStack gap="$2" marginBottom="$2">
              <Text fontSize="$7" fontWeight="700" color="$textPrimary" textAlign="center">
                {t('forgotPasswordTitle')}
              </Text>
              <Text fontSize="$4" color="$textSecondary" textAlign="center">
                {t('forgotPasswordDescription')}
              </Text>
            </YStack>

            {error && (
              <ErrorBanner title={t('errorUnknown')} message={error.message} onDismiss={clearError} />
            )}

            <ForgotPasswordForm onSubmit={handleSubmit} isLoading={isLoading} />

            <Button
              chromeless
              alignSelf="center"
              color="$chineseGold"
              fontWeight="600"
              marginTop="$3"
              onPress={handleBackToLogin}
            >
              {t('backToLogin')}
            </Button>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
