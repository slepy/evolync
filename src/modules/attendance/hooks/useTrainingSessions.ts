import { useCallback, useEffect, useState } from "react";
import TrainingSession from "@/database/models/TrainingSession";
import { useStore } from "@/store";
import {
  createTrainingSession,
  deleteTrainingSession,
  getOrCreateSessionForDate,
} from "../services";
import type { CreateTrainingSessionDto } from "../types";
import { TrainingSessionRepository } from "../repositories";

/**
 * Hook for managing training sessions for a school
 *
 * Features:
 * - Reactive to local database changes via repository
 * - Background sync with Supabase
 * - CRUD operations
 */
export const useTrainingSessions = (schoolId: string | undefined) => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { performSync } = useStore();

  // Subscribe to local database changes via repository
  useEffect(() => {
    if (!schoolId) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    const subscription = TrainingSessionRepository.observeBySchoolId(schoolId).subscribe({
      next: (result: TrainingSession[]) => {
        setSessions(result);
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useTrainingSessions] Observer error:", err);
        setError(t("errorLoadingFailed"));
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [schoolId]);

  // Create a new session
  const handleCreateSession = useCallback(
    async (data: Omit<CreateTrainingSessionDto, "schoolId">) => {
      if (!schoolId) {
        throw new Error("attendanceErrorNoSchool");
      }

      try {
        setError(null);
        const session = await createTrainingSession({
          ...data,
          schoolId,
        });
        return session;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("errorCreateFailed");
        setError(message);
        throw err;
      }
    },
    [schoolId]
  );

  // Get or create session for today
  const handleGetOrCreateToday = useCallback(async () => {
    if (!schoolId) {
      throw new Error("attendanceErrorNoSchool");
    }

    try {
      setError(null);
      const today = new Date().toISOString().split("T")[0];
      return await getOrCreateSessionForDate(schoolId, today);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("errorCreateFailed");
      setError(message);
      throw err;
    }
  }, [schoolId]);

  // Delete a session
  const handleDeleteSession = useCallback(async (sessionId: string) => {
    try {
      setError(null);
      await deleteTrainingSession(sessionId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("errorDeleteFailed");
      setError(message);
      throw err;
    }
  }, []);

  // Manual refresh - triggers global sync
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await performSync(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("errorLoadingFailed");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [performSync]);

  return {
    sessions,
    isLoading,
    error,
    createSession: handleCreateSession,
    getOrCreateToday: handleGetOrCreateToday,
    deleteSession: handleDeleteSession,
    refresh,
  };
};
