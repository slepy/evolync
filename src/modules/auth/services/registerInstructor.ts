import { supabase } from "@/config/supabase";
import type {
  RegisterInstructorRequest,
  RegisterInstructorResponse,
} from "../types/registerDto";
import { signUpInstructor } from "./instructorSignUp";

/**
 * Registers a new instructor together with their organization, default roles
 * and first school (one transaction, see `signUpInstructor`).
 *
 * @throws Error with Supabase's message when the e-mail is taken by another
 * account, or when sign-up fails.
 */
export async function registerInstructor(
  request: RegisterInstructorRequest,
): Promise<RegisterInstructorResponse> {
  return signUpInstructor(supabase, request);
}
