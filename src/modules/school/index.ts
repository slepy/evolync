// ============================================================================
// School Module Exports
// ============================================================================

// Components
export { SchoolCard, CreateSchoolForm } from './components';

// Repositories
export {
  SchoolRepository,
  SchoolSettingsRepository,
  SchoolInviteRepository,
} from './repositories';

// Hooks
export { useCreateSchool } from './hooks';

// Services
export { createSchool } from './services';

// Validation
export { createSchoolSchema } from './validation';
export type { CreateSchoolFormValues } from './validation';

// Types
export type { CreateSchoolDto, SchoolRecord } from './types';
