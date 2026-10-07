import { useAuth } from "@/modules/auth/hooks/useAuth";
import { JoinSchoolScreen } from "@/modules/school/components";
import { useLocalSearchParams, useRouter } from "expo-router";

/**
 * Join a school by code. Opened from the No school card, the context sheet
 * ("Join another school") and right after sign-up (`from=signup`: back and
 * Done go to the dashboard, never back to the auth screens).
 */
export default function JoinSchoolRoute() {
  const router = useRouter();
  const { user } = useAuth();
  const { from } = useLocalSearchParams<{ from?: string }>();

  const leave = () =>
    from !== "signup" && router.canGoBack() ? router.back() : router.replace("/user/dashboard");

  return (
    <JoinSchoolScreen
      user={
        user?.email
          ? {
              id: user.id,
              email: user.email,
              displayName: user.user_metadata?.full_name || user.email,
              avatarUrl: user.user_metadata?.avatar_url as string | undefined,
            }
          : null
      }
      onBack={leave}
      onDone={leave}
    />
  );
}
