import { useState } from "react";
import { useRouter } from "expo-router";
import { register as registerService } from "../services";
import type { RegisterRequest } from "../types/registerDto";
import { useStore } from "@/store";
import { sync } from "@/database/sync";
import { supabase } from "@/config/supabase";

interface UseRegisterResult {
  register: (data: RegisterRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for managing user registration flow (no organization)
 *
 * Flow:
 * 1. Register via service
 * 2. Update global store (user, session via syncOrganization)
 * 3. Trigger sync
 * 4. Navigate to join-school screen (user can skip)
 */
export function useRegister(): UseRegisterResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setUser, setSession, setOrganization } = useStore();

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      await registerService(data);

      // Get current session and user from Supabase
      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData.session) {
        setUser(sessionData.session.user);
        setSession(sessionData.session);

        // Users don't have organizations (only instructors do)
        setOrganization(null);

        // Trigger background sync
        sync().catch(console.error);
      }

      // Navigate to join-school screen
      // User can enter school code or skip to dashboard
      router.replace("/school/join");
    } catch (err: any) {
      console.error("Registration failed:", err);

      // Map error messages to translation keys
      const errorKey = err?.message || "errorUnknown";
      setError(errorKey);
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading, error };
}
