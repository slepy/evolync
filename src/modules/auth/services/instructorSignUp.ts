import type {
  RegisterInstructorRequest,
  RegisterInstructorResponse,
} from "../types/registerDto";

/** The part of the Supabase client instructor sign-up uses (injected so it can be tested). */
export interface InstructorSignUpClient {
  auth: {
    signUp(params: any): Promise<{ data: { user: any; session: any }; error: any }>;
    signInWithPassword(params: any): Promise<{ data: { user: any; session: any }; error: any }>;
    setSession(params: any): Promise<unknown>;
    getSession(): Promise<{ data: { session: any }; error: any }>;
    signOut(): Promise<unknown>;
  };
  from(table: string): any;
  rpc(fn: string, params: Record<string, unknown>): PromiseLike<{ data: any; error: any }>;
}

/** Sign-up rejected because an account with this e-mail exists. */
export const isEmailTakenError = (error: { code?: string; message?: string } | null | undefined): boolean =>
  !!error &&
  (error.code === "user_already_exists" ||
    error.code === "email_exists" ||
    /already (been )?registered|already exists/i.test(error.message ?? ""));

const ownedOrganizationId = async (client: InstructorSignUpClient, userId: string): Promise<string | null> => {
  const { data, error } = await client
    .from("organizations")
    .select("id")
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
};

/**
 * Account that exists without an organization (left by the old two-call
 * sign-up when the organization step failed): the user proves it is theirs
 * with the password, and the organization setup is completed.
 */
const completeExistingAccount = async (
  client: InstructorSignUpClient,
  request: RegisterInstructorRequest,
  emailTakenError: Error,
): Promise<RegisterInstructorResponse> => {
  const { data, error } = await client.auth.signInWithPassword({
    email: request.email,
    password: request.password,
  });
  if (error || !data.user || !data.session) throw emailTakenError;

  const userId: string = data.user.id;
  try {
    const existing = await ownedOrganizationId(client, userId);
    if (existing) return { user_id: userId, organization_id: existing };

    const { data: setup, error: setupError } = await client.rpc("setup_instructor_organization", {
      p_user_id: userId,
      p_organization_name: request.organization_name,
      p_school_name: request.school_name,
      p_full_name: request.full_name,
    });
    if (setupError || !setup?.success) {
      throw new Error(setupError?.message || "organization_setup_failed");
    }
    return { user_id: userId, organization_id: setup.organization_id };
  } catch (err) {
    // Don't leave a stored session that would open the student dashboard on the next start.
    await client.auth.signOut().catch(() => undefined);
    throw err;
  }
};

/**
 * Registers an instructor in one step: the organization, its default roles
 * and the first school are created by the `handle_new_user_signup` trigger
 * from the sign-up metadata, in the same database transaction as the account
 * — sign-up either fully succeeds or leaves nothing behind.
 */
export async function signUpInstructor(
  client: InstructorSignUpClient,
  request: RegisterInstructorRequest,
): Promise<RegisterInstructorResponse> {
  const { data: authData, error: signUpError } = await client.auth.signUp({
    email: request.email,
    password: request.password,
    options: {
      data: {
        full_name: request.full_name,
        organization_name: request.organization_name,
        school_name: request.school_name,
      },
      // Auto-confirmation is enabled in the Supabase project (offline-first MVP).
      emailRedirectTo: undefined,
    },
  });

  if (signUpError) {
    const error = new Error(signUpError.message);
    if (isEmailTakenError(signUpError)) return completeExistingAccount(client, request, error);
    throw error;
  }
  if (!authData.user) {
    throw new Error("User creation failed");
  }

  let activeSession = authData.session;
  if (activeSession) {
    await client.auth.setSession({
      access_token: activeSession.access_token,
      refresh_token: activeSession.refresh_token,
    });
  } else {
    // No session from signUp: read the current one rather than navigating to a protected screen without it.
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw new Error(sessionError.message);
    activeSession = sessionData.session;
  }
  if (!activeSession) {
    throw new Error("no_active_session_after_signup");
  }

  const organizationId = await ownedOrganizationId(client, authData.user.id);
  if (!organizationId) {
    throw new Error("organization_setup_failed");
  }
  return { user_id: authData.user.id, organization_id: organizationId };
}
