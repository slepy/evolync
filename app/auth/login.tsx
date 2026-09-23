import { LoginForm } from '@/modules/auth/components/LoginForm';
import { RegisterPrompt } from '@/modules/auth/components/RegisterPrompt';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import type { FormErrors, LoginFormData } from '@/modules/auth/validation/loginSchema';
import { AppLogo } from '@/modules/core/components/AppLogo';
import { ErrorBanner } from '@/modules/core/components/ErrorBanner';
import { LoadingScreen } from '@/modules/core/components/LoadingScreen';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, YStack } from 'tamagui';

// ============================================================================
// LoginScreen Component
// ============================================================================

export default function LoginScreen() {
  const router = useRouter();
  const {
    isLoading,
    error,
    signInWithEmail,
    checkSession,
    clearError,
  } = useAuth();

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // ==========================================================================
  // Auto-login on mount
  // ==========================================================================

  useEffect(() => {
    const initializeAuth = async () => {
      setIsCheckingSession(true);
      await checkSession();
      setIsCheckingSession(false);
    };

    initializeAuth();
  }, []);

  // ==========================================================================
  // Map backend errors to form fields
  // ==========================================================================

  useEffect(() => {
    if (error) {
      // Map specific error codes to form fields
      if (error.code === 'invalid_credentials') {
        setFormErrors({
          general: error.message,
        });
      } else {
        setFormErrors({
          general: error.message,
        });
      }
    } else {
      setFormErrors({});
    }
  }, [error]);

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  const handleEmailLogin = async (data: LoginFormData) => {
    // Clear previous errors
    clearError();
    setFormErrors({});

    await signInWithEmail({
      email: data.email,
      password: data.password,
    });
  };

  const handleNavigateToRegister = () => {
    router.push('/auth/register' as any);
  };

  // ==========================================================================
  // Loading State
  // ==========================================================================

  if (isCheckingSession) {
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
          <YStack flex={1} justifyContent="center" maxWidth={420} width="100%" alignSelf="center">
            {/* Logo */}
            <AppLogo />

            {/* Error Banner */}
            {error && <ErrorBanner title={t('errorUnknown')} message={error.message} onDismiss={clearError} />}

            {/* Login Form */}
            <LoginForm onSubmit={handleEmailLogin} isLoading={isLoading} errors={formErrors} />

            {/* Register Prompt */}
            <RegisterPrompt onNavigate={handleNavigateToRegister} />
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
