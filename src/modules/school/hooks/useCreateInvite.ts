import { useState, useCallback } from "react";
import type SchoolInvite from "@/database/models/SchoolInvite";
import { createInvite } from "../services/inviteService";

/**
 * Hook for creating a new school invite
 */
export const useCreateInvite = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateInvite = useCallback(
    async (
      schoolId: string,
      expiresAt: number,
    ): Promise<SchoolInvite | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const invite = await createInvite(schoolId, expiresAt);

        return invite;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error creating invite";
        setError(errorMessage);
        console.error("Error creating invite:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    createInvite: handleCreateInvite,
    isLoading,
    error,
  };
};
