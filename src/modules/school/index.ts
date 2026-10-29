// ============================================================================
// School Module Exports
// ============================================================================

// Repositories
export {
  SchoolRepository,
  SchoolSettingsRepository,
  SchoolInviteRepository,
} from './repositories';

// Hooks
export { useCreateSchool, useOwnMembershipsWatcher } from './hooks';

// Services
export { createSchool } from './services';

// Validation
export { createSchoolSchema } from './validation';
export type { CreateSchoolFormValues } from './validation';

// Types
export type { CreateSchoolDto } from './types';
