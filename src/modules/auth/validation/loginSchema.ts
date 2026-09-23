// ============================================================================
// Login Form Data Types
// ============================================================================
// No frontend validation - only backend error handling

export type LoginFormData = {
  email: string;
  password: string;
};

export type FormErrors = {
  email?: string;
  password?: string;
  general?: string;
};
