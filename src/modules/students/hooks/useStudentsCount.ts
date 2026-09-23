import { useEffect, useState } from 'react';
import { observeStudentsCount } from '../services';

/**
 * Hook to get the count of students in a school
 * Uses service layer for data access
 *
 * @param schoolId - School ID to count students for
 * @returns Number of students in the school
 */
export const useStudentsCount = (schoolId: string | undefined): number => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!schoolId) {
      setCount(0);
      return;
    }

    const subscription = observeStudentsCount(schoolId).subscribe(
      (result) => setCount(result),
      (error) => {
        console.error('Error observing students count:', error);
        setCount(0);
      }
    );

    return () => subscription.unsubscribe();
  }, [schoolId]);

  return count;
};
