import { supabase } from '@/config/supabase';
import { ResetPasswordForm } from '@/modules/auth/components/ResetPasswordForm';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';

// ============================================================================
// ResetPasswordScreen Component — new password board
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

  // The auth error lives in the global store: drop one left over from sign in.
  useEffect(() => {
    clearError();
  }, []);

  // verifyOtp consumes the code (single use) and opens a recovery session.
  // If updatePassword then fails (weak/same password, network), a retry
  // must not re-verify — Supabase would reject the already-used code.
  const [codeVerified, setCodeVerified] = useState(false);

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
    router.replace('/auth/reset-done' as any);
  };

  const handleRequestNewCode = async () => {
    clearError();
    // Drop the half-finished recovery session before starting over.
    if (codeVerified) await supabase.auth.signOut();
    router.replace('/auth/forgot-password' as any);
  };

  return (
    <ResetPasswordForm
      email={email}
      onSubmit={handleSubmit}
      onRequestNewCode={handleRequestNewCode}
      isLoading={isLoading}
      error={error}
      onDismissError={clearError}
    />
  );
}
