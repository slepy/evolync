import { supabase } from "@/config/supabase";
import type { RegisterRequest, RegisterResponse } from "../types/registerDto";

/**
 * Registers a new user account (no organization setup).
 *
 * Process:
 * 1. Create auth user via Supabase Auth
 * 2. Auto-login the new user
 * 3. Return user_id
 *
 * Note: No RPC call needed - accounts without organization
 */
export async function register(
  request: RegisterRequest,
): Promise<RegisterResponse> {
  try {
    // Step 1: Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: request.email,
      password: request.password,
      options: {
        data: {
          full_name: request.full_name || "",
          ...(request.phone_number ? { phone_number: request.phone_number } : {}),
        },
        emailRedirectTo: undefined,
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("errorRegistrationFailed");

    // Step 2: Auto-login (set session)
    if (authData.session) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      });

      if (sessionError) {
        console.warn("Session setup failed:", sessionError);
      }
    }

    // Step 3: Return response
    return {
      user_id: authData.user.id,
    };
  } catch (error: any) {
    console.error("User registration error:", error);

    // Map common errors to translation keys
    if (error?.message?.includes("already registered")) {
      throw new Error(t("errorEmailAlreadyExists"));
    }

    throw error;
  }
}
