import { useState, useCallback } from 'react';
import type SchoolMember from '@/database/models/SchoolMember';
import { createStudent } from '../services';
import type { CreateStudentDto } from '../types';

/**
 * Hook for creating a new student (Shadow User) with loading and error state management
 *
 * Features:
 * - Loading state tracking
 * - Error handling with user-friendly messages
 * - Optimistic UI support (WatermelonDB observables)
 * - Works offline (US-003a)
 *
 * @returns Object with createStudent function, loading state, error, and reset
 *
 * @example
 * const { createStudent: handleCreate, isLoading, error } = useCreateStudent();
 *
 * const onSubmit = async (data: CreateStudentDto) => {
 *   const student = await handleCreate(schoolId, data);
 *   if (student) {
 *     navigation.goBack();
 *   }
 * };
 */
export const useCreateStudent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateStudent = useCallback(
    async (schoolId: string, data: CreateStudentDto): Promise<SchoolMember | null> => {
      try {
        setIsLoading(true);
        setError(null);

        // Call service to create student
        const student = await createStudent(schoolId, data);

        return student;
      } catch (err) {
        // Handle errors
        const errorMessage = err instanceof Error ? err.message : t('errorCreateFailed');
        setError(errorMessage);
        console.error('Error creating student:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    createStudent: handleCreateStudent,
    isLoading,
    error,
    reset,
  };
};
