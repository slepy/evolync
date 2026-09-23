import { AppLogo } from '@/modules/core/components/AppLogo';
import { AccountTypeCard, LoginPrompt } from '@/modules/auth';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, YStack } from 'tamagui';

// ============================================================================
// RegisterScreen Component
// ============================================================================

export default function RegisterScreen() {
  const router = useRouter();

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  const handleOwnerPress = () => {
    router.push('/auth/register/instructor' as any);
  };

  const handleUserPress = () => {
    router.push('/auth/register/user' as any);
  };

  // ==========================================================================
  // Main Render
  // ==========================================================================

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <YStack flex={1} justifyContent="center" maxWidth={420} width="100%" alignSelf="center">
          {/* Logo */}
          <AppLogo />

          {/* Account Type Options */}
          <YStack gap="$3">
            <AccountTypeCard
              title={t('createOrganization')}
              description={t('createOrganizationDescription')}
              icon="owner"
              onPress={handleOwnerPress}
            />

            <AccountTypeCard
              title={t('joinAsPractitioner')}
              description={t('joinAsPractitionerDescription')}
              icon="student"
              onPress={handleUserPress}
            />
          </YStack>

          {/* Back to Login */}
          <LoginPrompt onNavigate={() => router.push('/auth/login' as any)} />
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
