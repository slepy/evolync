import { useState, useCallback } from 'react';
import type School from '@/database/models/School';
import { createSchool } from '../services';
import type { CreateSchoolDto } from '../types';

/**
 * Hook for creating a new school with loading and error state management
 *
 * Features:
 * - Loading state tracking
 * - Error handling with user-friendly messages
 * - Optimistic UI support (WatermelonDB observables)
 * - Works offline
 *
 * @returns Object with createSchool function, loading state, error, and reset
 *
 * @example
 * const { createSchool: handleCreate, isLoading, error } = useCreateSchool();
 *
 * const onSubmit = async (data: CreateSchoolDto) => {
 *   const school = await handleCreate(data);
 *   if (school) {
 *     navigation.goBack();
 *   }
 * };
 */
export const useCreateSchool = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateSchool = useCallback(async (data: CreateSchoolDto): Promise<School | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Call service to create school
      const school = await createSchool(data);

      return school;
    } catch (err) {
      // Handle errors
      const errorMessage = err instanceof Error ? err.message : t('errorCreateFailed');
      setError(errorMessage);
      console.error('Error creating school:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    createSchool: handleCreateSchool,
    isLoading,
    error,
    reset,
  };
};
