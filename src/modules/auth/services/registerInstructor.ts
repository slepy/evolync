import { supabase } from "@/config/supabase";
import type {
  RegisterInstructorRequest,
  RegisterInstructorResponse,
} from "../types/registerDto";

/**
 * Registers a new instructor with complete organizational setup.
 *
 * This function performs a two-step process:
 * 1. Creates a user account via Supabase Auth (email auto-confirmed for offline-first MVP)
 * 2. Calls setup_instructor_organization RPC function to:
 *    - Create a new organization owned by the user
 *    - Create default organization roles (Owner, Instructor, Student)
 *    - Create the first school for the organization
 *
 * **Implementation Note:** Uses RPC function with security definer to bypass RLS policies
 * during initial setup. This is necessary because the user session may not be fully
 * propagated immediately after signup.
 *
 * @param request - Registration data including email, password, full name, organization name, and school name
 * @returns Promise resolving to the created user_id, organization_id, and school_id
 * @throws Error if registration fails (e.g., duplicate email, validation errors, organization setup failure)
 *
 * @example
 * ```typescript
 * try {
 *   const result = await registerInstructor({
 *     email: 'john@cobrakaidojo.com',
 *     password: 'SecurePass123',
 *     full_name: 'John Kreese',
 *     organization_name: 'Cobra Kai Dojo',
 *     school_name: 'Cobra Kai Dojo NY',
 *   });
 * } catch (error) {
 *   if (error.message.includes('already registered')) {
 *     // Handle duplicate email
 *   }
 * }
 * ```
 */
export async function registerInstructor(
  request: RegisterInstructorRequest,
): Promise<RegisterInstructorResponse> {
  // Use Supabase Auth's signup with auto-confirmation
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: request.email,
    password: request.password,
    options: {
      data: {
        full_name: request.full_name,
      },
      // Disable email confirmation - user is auto-confirmed for offline-first MVP
      emailRedirectTo: undefined,
      // Note: Auto-confirmation must be enabled in Supabase Dashboard:
      // Authentication -> Settings -> Enable "Confirm email" toggle OFF
    },
  });

  if (signUpError) {
    throw new Error(signUpError.message);
  }

  if (!authData.user) {
    throw new Error("User creation failed");
  }

  let activeSession = authData.session;

  // Set the session explicitly to ensure RPC calls work
  if (activeSession) {
    await supabase.auth.setSession({
      access_token: activeSession.access_token,
      refresh_token: activeSession.refresh_token,
    });
  } else {
    // If no session is returned from signUp, try to read the current session.
    // This avoids navigating to a protected screen without authenticated state.
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(sessionError.message);
    }

    activeSession = sessionData.session;
  }

  if (!activeSession) {
    throw new Error("no_active_session_after_signup");
  }

  // Call RPC function to setup organization
  const { data: setupData, error: setupError } = await supabase.rpc(
    "setup_instructor_organization",
    {
      p_user_id: authData.user.id,
      p_organization_name: request.organization_name,
      p_school_name: request.school_name,
      p_full_name: request.full_name,
    },
  );

  if (setupError) {
    throw new Error(
      setupError.message ||
        "Organization setup failed. Please contact support or try again.",
    );
  }

  if (!setupData || !setupData.success) {
    throw new Error("Organization setup failed. Please contact support.");
  }

  const response: RegisterInstructorResponse = {
    user_id: authData.user.id,
    organization_id: setupData.organization_id,
    school_id: setupData.school_id,
  };

  return response;
}
