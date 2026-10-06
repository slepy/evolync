import { ForgotPasswordForm } from '@/modules/auth/components/ForgotPasswordForm';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';

// ============================================================================
// ForgotPasswordScreen Component — forgot password board
// ============================================================================

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { isLoading, error, sendPasswordResetEmail, clearError } = useAuth();

  // The auth error lives in the global store: drop one left over from sign in.
  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (email: string) => {
    clearError();
    const success = await sendPasswordResetEmail(email);
    if (success) {
      router.replace({ pathname: '/auth/reset-password' as any, params: { email } });
    }
  };

  const handleSignIn = () => {
    clearError();
    router.replace('/auth/login' as any);
  };

  return (
    <ForgotPasswordForm
      onSubmit={handleSubmit}
      onSignIn={handleSignIn}
      isLoading={isLoading}
      error={error}
      onDismissError={clearError}
    />
  );
}
