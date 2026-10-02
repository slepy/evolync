import { supabase } from '@/config/supabase';
import { ResetPasswordForm } from '@/modules/auth/components/ResetPasswordForm';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { AppLogo } from '@/modules/core/components/AppLogo';
import { ErrorBanner } from '@/modules/core/components/ErrorBanner';
import { CheckCircle } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ScrollView, Text, YStack } from 'tamagui';

// ============================================================================
// ResetPasswordScreen Component
//
// No deep link involved: the user copies the OTP code (6–10 digits, per Supabase config) from the email
// Supabase sends and types it in here, alongside the new password. This
// avoids relying on the app's custom URL scheme being registered in
// Supabase's Redirect URLs allow-list (see auth-module spec for the
// localhost:3000 fallback bug that motivated this design).
// ============================================================================

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const email = emailParam ?? '';
  const { isLoading, error, verifyRecoveryOtp, updatePassword, clearError } = useAuth();

  const [passwordUpdated, setPasswordUpdated] = useState(false);
  // verifyOtp consumes the code (single use) and opens a recovery session.
  // If updatePassword then fails (weak/same password, network), a retry
  // must not re-verify — Supabase would reject the already-used code.
  const [codeVerified, setCodeVerified] = useState(false);

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  const handleSubmit = async (code: string, password: string) => {
    clearError();

    if (!codeVerified) {
      const codeValid = await verifyRecoveryOtp(email, code);
      if (!codeValid) return;
      setCodeVerified(true);
    }

    const passwordSet = await updatePassword(password);
    if (!passwordSet) return;

    // Invalidate the temporary recovery session so the user signs in fresh.
    await supabase.auth.signOut();
    setPasswordUpdated(true);
  };

  const handleGoToLogin = () => {
    router.replace('/auth/login' as any);
  };

  const handleRequestNewCode = async () => {
    // Drop the half-finished recovery session before starting over.
    if (codeVerified) await supabase.auth.signOut();
    router.replace('/auth/forgot-password' as any);
  };

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

            {passwordUpdated ? (
              <YStack alignItems="center" gap="$4" marginTop="$4">
                <CheckCircle size={56} color="#16A34A" />
                <Text fontSize="$6" fontWeight="700" color="$textPrimary" textAlign="center">
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
                  <Text fontSize="$7" fontWeight="700" color="$textPrimary" textAlign="center">
                    {t('resetPasswordTitle')}
                  </Text>
                  <Text fontSize="$4" color="$textSecondary" textAlign="center">
                    {email
                      ? t('resetPasswordCodeSentTo', { email })
                      : t('resetPasswordDescription')}
                  </Text>
                </YStack>

                {error && (
                  <ErrorBanner title={t('errorUnknown')} message={error.message} onDismiss={clearError} />
                )}

                <ResetPasswordForm onSubmit={handleSubmit} isLoading={isLoading} />

                <Button
                  chromeless
                  alignSelf="center"
                  color="$chineseGold"
                  fontWeight="600"
                  marginTop="$3"
                  onPress={handleRequestNewCode}
                >
                  {t('requestNewCode')}
                </Button>
              </>
            )}
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
