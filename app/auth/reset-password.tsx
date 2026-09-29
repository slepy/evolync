import { supabase } from '@/config/supabase';
import { ResetPasswordForm } from '@/modules/auth/components/ResetPasswordForm';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { AppLogo } from '@/modules/core/components/AppLogo';
import { ErrorBanner } from '@/modules/core/components/ErrorBanner';
import { LoadingScreen } from '@/modules/core/components/LoadingScreen';
import { CheckCircle, XCircle } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ScrollView, Text, YStack } from 'tamagui';

// ============================================================================
// ResetPasswordScreen Component
// ============================================================================

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isLoading, error, updatePassword, clearError } = useAuth();

  const [isValidatingLink, setIsValidatingLink] = useState(true);
  const [linkValid, setLinkValid] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  // ==========================================================================
  // Establish the temporary recovery session from the deep-link tokens
  // ==========================================================================

  useEffect(() => {
    const establishRecoverySession = async () => {
      try {
        const { access_token, refresh_token, type } = params;

        if (!access_token || !refresh_token || type !== 'recovery') {
          setLinkValid(false);
          setIsValidatingLink(false);
          return;
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: access_token as string,
          refresh_token: refresh_token as string,
        });

        setLinkValid(!sessionError);
      } catch (err) {
        console.error('Reset password link validation error:', err);
        setLinkValid(false);
      } finally {
        setIsValidatingLink(false);
      }
    };

    establishRecoverySession();
  }, [params]);

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  const handleSubmit = async (password: string) => {
    clearError();
    const success = await updatePassword(password);
    if (success) {
      // Invalidate the temporary recovery session so the user signs in fresh.
      await supabase.auth.signOut();
      setPasswordUpdated(true);
    }
  };

  const handleGoToLogin = () => {
    router.replace('/auth/login' as any);
  };

  const handleRequestNewLink = () => {
    router.replace('/auth/forgot-password' as any);
  };

  // ==========================================================================
  // Loading State
  // ==========================================================================

  if (isValidatingLink) {
    return <LoadingScreen />;
  }

  // ==========================================================================
  // Main Render
  // ==========================================================================

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

            {!linkValid ? (
              <YStack alignItems="center" gap="$4" marginTop="$4">
                <XCircle size={56} color="#DC2626" />
                <Text fontSize="$6" fontWeight="700" color="$inkBlack" textAlign="center">
                  {t('invalidResetLink')}
                </Text>
                <Text fontSize="$4" color="$softGrayDark" textAlign="center">
                  {t('invalidResetLinkMessage')}
                </Text>
                <Button
                  backgroundColor="$jadeGreen"
                  color="$pearlWhite"
                  fontWeight="700"
                  onPress={handleRequestNewLink}
                >
                  {t('requestNewLink')}
                </Button>
              </YStack>
            ) : passwordUpdated ? (
              <YStack alignItems="center" gap="$4" marginTop="$4">
                <CheckCircle size={56} color="#16A34A" />
                <Text fontSize="$6" fontWeight="700" color="$inkBlack" textAlign="center">
                  {t('passwordResetSuccess')}
                </Text>
                <Button
                  backgroundColor="$jadeGreen"
                  color="$pearlWhite"
                  fontWeight="700"
                  onPress={handleGoToLogin}
                >
                  {t('backToLogin')}
                </Button>
              </YStack>
            ) : (
              <>
                <YStack gap="$2" marginBottom="$2">
                  <Text fontSize="$7" fontWeight="700" color="$inkBlack" textAlign="center">
                    {t('resetPasswordTitle')}
                  </Text>
                  <Text fontSize="$4" color="$softGrayDark" textAlign="center">
                    {t('resetPasswordDescription')}
                  </Text>
                </YStack>

                {error && (
                  <ErrorBanner title={t('errorUnknown')} message={error.message} onDismiss={clearError} />
                )}

                <ResetPasswordForm onSubmit={handleSubmit} isLoading={isLoading} />
              </>
            )}
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
