import { AuthPage, AuthPrompt, LaunchScreen } from '@/core/components';
import { AuthLogo } from '@/modules/auth/components/AuthLogo';
import { LoginForm } from '@/modules/auth/components/LoginForm';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import type { LoginFormData } from '@/modules/auth/validation/loginSchema';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';

// ============================================================================
// LoginScreen Component — sign in board
// ============================================================================

export default function LoginScreen() {
  const router = useRouter();
  const { isLoading, error, signInWithEmail, checkSession, clearError } = useAuth();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Auto-login on mount
  useEffect(() => {
    const initializeAuth = async () => {
      setIsCheckingSession(true);
      await checkSession();
      setIsCheckingSession(false);
    };

    initializeAuth();
  }, []);

  const handleEmailLogin = async (data: LoginFormData) => {
    clearError();
    await signInWithEmail({ email: data.email, password: data.password });
  };

  if (isCheckingSession) {
    return <LaunchScreen />;
  }

  return (
    <AuthPage
      bottom={
        <AuthPrompt text={t('authNoAccount')} action={t('authSignUp')} onPress={() => router.push('/auth/register' as any)} />
      }
    >
      <AuthLogo subtitle={t('authSignInSubtitle')} />
      <LoginForm onSubmit={handleEmailLogin} isLoading={isLoading} error={error} onDismissError={clearError} />
    </AuthPage>
  );
}
