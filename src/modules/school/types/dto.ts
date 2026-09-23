/**
 * Data Transfer Objects for School module
 * These types represent data flowing between UI and services
 */

/**
 * DTO for creating a new school
 * @property name - School name (required)
 *
 * Note: organization_id is obtained from user context and not part of the DTO
 */
export interface CreateSchoolDto {
  name: string;
}

/**
 * DTO for updating an existing school
 * All fields are optional - only provided fields will be updated
 */
export interface UpdateSchoolDto {
  name?: string;
  address?: string;
}

/**
 * DTO for school settings (payment defaults)
 */
export interface SchoolSettingsDto {
  defaultCurrency: string;
  defaultPaymentAmount: number;
}
