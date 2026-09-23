import { useEffect, useState } from "react";
import TrainingSession from "@/database/models/TrainingSession";
import { TrainingSessionRepository } from "../repositories";

/**
 * Hook that checks if a training session exists for today
 *
 * @param schoolId - The school ID to check
 * @returns Object containing todaySession (if exists) and hasSessionToday boolean
 */
export const useTodaySession = (schoolId: string | undefined) => {
  const [todaySession, setTodaySession] = useState<TrainingSession | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) {
      setTodaySession(null);
      setIsLoading(false);
      return;
    }

    // Use repository's observeTodayBySchoolId method
    const subscription = TrainingSessionRepository.observeTodayBySchoolId(schoolId).subscribe({
      next: (sessions: TrainingSession[]) => {
        setTodaySession(sessions.length > 0 ? sessions[0] : null);
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useTodaySession] Observer error:", err);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [schoolId]);

  return {
    todaySession,
    hasSessionToday: todaySession !== null,
    isLoading,
  };
};
