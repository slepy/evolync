import { AuthIntro, AuthPage, AuthPrompt } from '@/core/components';
import { AccountTypeOption } from '@/modules/auth/components/AccountTypeOption';
import { useRouter } from 'expo-router';
import React from 'react';
import { YStack } from 'tamagui';

// ============================================================================
// RegisterScreen Component — sign up board (account type)
// ============================================================================

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <AuthPage
      title={t('authSignUp')}
      onBack={() => router.replace('/auth/login' as any)}
      bottom={
        <AuthPrompt text={t('authHaveAccount')} action={t('authSignIn')} onPress={() => router.replace('/auth/login' as any)} />
      }
    >
      <YStack gap={14}>
        <YStack marginBottom={6}>
          <AuthIntro title={t('authAccountTypeTitle')} description={t('authAccountTypeDescription')} />
        </YStack>
        <AccountTypeOption
          type="organization"
          title={t('authAccountTypeOrganization')}
          description={t('authAccountTypeOrganizationDescription')}
          chips={[t('authRoleInstructor'), t('authRoleOwner')]}
          onPress={() => router.push('/auth/register/instructor' as any)}
        />
        <AccountTypeOption
          type="student"
          title={t('authAccountTypeStudent')}
          description={t('authAccountTypeStudentDescription')}
          chips={[t('authRoleStudent')]}
          onPress={() => router.push('/auth/register/user' as any)}
        />
      </YStack>
    </AuthPage>
  );
}
