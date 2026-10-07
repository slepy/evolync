// ============================================================================
// Auth Module Exports
// ============================================================================

// Hooks
export { useAuth } from "./hooks/useAuth";
export { useRegister } from "./hooks/useRegister";

// Components
export * from "./components";

// Services
export { registerInstructor } from "./services";

// Types
export type {
  RegisterInstructorRequest,
  RegisterInstructorResponse,
} from "./types/registerDto";

// Utils
export {
  isLocalPhoto,
  profileValuesFromUser,
  toProfileMetadata,
  type ProfileMetadata,
  type ProfileValues,
} from "./utils/profileValues";

// Validation
export type { LoginFormData, FormErrors } from "./validation/loginSchema";
export {
  profileSchema,
  type ProfileFormValues,
} from "./validation/profileSchema";
export {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "./validation/forgotPasswordSchema";
export {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "./validation/resetPasswordSchema";
