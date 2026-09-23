import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { useState } from "react";
import { useStore } from "@/store";
import { supabase } from "@/config/supabase";
import { registerInstructor } from "../services/registerInstructor";
import type { RegisterInstructorRequest } from "../types/registerDto";

const safeStorageSet = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === "web") {
    try {
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.setItem(key, value);
    } catch (storageError) {
      console.error("Storage set error:", storageError);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const waitForAuthContext = async (timeoutMs = 3000): Promise<boolean> => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const state = useStore.getState();
    if (state.user?.id && state.organization?.id) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return false;
};

/**
 * Hook for managing instructor registration flow.
 *
 * Handles:
 * - Registration API call
 * - Loading state
 * - Error handling
 * - Auto-login after successful registration
 * - Navigation to dashboard
 *
 * @example
 * ```tsx
 * const { register, isLoading, error } = useRegisterInstructor();
 *
 * const handleSubmit = async (data) => {
 *   await register(data);
 * };
 * ```
 */
export function useRegisterInstructor() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const {
    setUser,
    setSession,
    setOrganization,
    setSchoolMemberships,
    setActiveMembershipId,
    performSync,
  } = useStore();

  /**
   * Registers a new instructor.
   * The user is automatically logged in by Supabase Auth after signup.
   * On success, navigates to the school-specific dashboard.
   */
  const register = async (data: RegisterInstructorRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      // Call the registration service
      // This uses Supabase Auth's signUp which automatically logs in the user
      const result = await registerInstructor(data);

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error("no_active_session_after_signup");
      }

      const organization = {
        id: result.organization_id,
        owner_id: result.user_id,
        name: data.organization_name,
      };

      // Hydrate auth + organization state before navigation to avoid loading loops.
      setUser(sessionData.session.user);
      setSession(sessionData.session);
      setOrganization(organization);
      setSchoolMemberships([]);
      setActiveMembershipId(null);

      await safeStorageSet("session", JSON.stringify(sessionData.session));
      await safeStorageSet("organization", JSON.stringify(organization));

      const hasAuthContext = await waitForAuthContext();
      if (!hasAuthContext) {
        throw new Error("auth_context_not_ready_after_signup");
      }

      // Navigate to the organization-specific dashboard
      // User is already logged in via the signUp call
      router.replace(`/organization/dashboard` as any);

      performSync(true).catch((syncError: unknown) => {
        console.error("[useRegisterInstructor] performSync failed:", syncError);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      // Handle specific error cases
      if (
        errorMessage.includes("already registered") ||
        errorMessage.includes("duplicate")
      ) {
        setError(t("errorEmailAlreadyExists"));
      } else if (errorMessage.includes("no_active_session_after_signup")) {
        setError(t("errorRegistrationFailed"));
      } else if (errorMessage.includes("auth_context_not_ready_after_signup")) {
        setError(t("errorRegistrationFailed"));
      } else {
        setError(t("errorRegistrationFailed"));
      }

      throw err; // Re-throw so the form can handle it if needed
    } finally {
      setIsLoading(false);
    }
  };

  return {
    register,
    isLoading,
    error,
  };
}
