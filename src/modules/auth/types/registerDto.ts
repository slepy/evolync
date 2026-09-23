/**
 * Request body for RPC: register_instructor
 * Registers a new user, organization, and school.
 */
export interface RegisterInstructorRequest {
  email: string;
  password: string;
  full_name: string;
  organization_name: string;
  school_name: string;
}

/**
 * Response from RPC: register_instructor
 */
export interface RegisterInstructorResponse {
  user_id: string;
  organization_id: string;
  school_id: string;
}

/**
 * Request body for user registration (no organization setup)
 * Only requires email and password
 */
export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string; // Optional
  phone_number?: string; // Optional, format: "+48123456789"
}

/**
 * Response from user registration
 * Returns only user_id (no organization or school)
 */
export interface RegisterResponse {
  user_id: string;
}
