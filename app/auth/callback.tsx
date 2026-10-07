import { supabase } from "@/config/supabase";
import { LaunchScreen } from "@/core/components";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { safeStorageSet } from "@/modules/auth/services/secureStorage";
import { useStore } from "@/store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";

// ============================================================================
// AuthCallbackScreen Component
// ============================================================================

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setError } = useStore();
  const { checkSession } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const { access_token, refresh_token } = params;

        if (!access_token || !refresh_token) {
          setError({
            code: "unknown",
            message: t("errorInvalidOAuthCallback"),
            recoverable: true,
          });
          router.replace("/auth/login" as any);
          return;
        }

        // Set session in Supabase
        const { data, error } = await supabase.auth.setSession({
          access_token: access_token as string,
          refresh_token: refresh_token as string,
        });

        if (error || !data.session) {
          setError({
            code: "unknown",
            message: t("errorGoogleLoginFailed"),
            recoverable: true,
          });
          router.replace("/auth/login" as any);
          return;
        }

        // Save session to storage
        await safeStorageSet("session", JSON.stringify(data.session));

        // checkSession() picks up the just-saved session, verifies it,
        // syncs organization/school-membership state, triggers a data sync,
        // and navigates on — the same sequence every other login path runs.
        await checkSession();
      } catch (error) {
        console.error("OAuth callback error:", error);
        setError({
          code: "unknown",
          message: t("errorLoginError"),
          recoverable: true,
        });
        router.replace("/auth/login" as any);
      }
    };

    handleOAuthCallback();
  }, [params]);

  return <LaunchScreen />;
}
