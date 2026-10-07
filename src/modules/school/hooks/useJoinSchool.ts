import { useState, useCallback } from "react";
import { joinSchool } from "../services";

export const useJoinSchool = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleJoinSchool = useCallback(
    async (
      code: string,
      userId: string,
      userEmail: string,
      displayName: string,
      avatarUrl?: string,
    ): Promise<string | null> => {
      try {
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        const schoolId = await joinSchool(code, userId, userEmail, displayName, avatarUrl);

        setSuccess(true);
        return schoolId;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : t("errorUnknown");
        setError(errorMessage);

        const validationErrors = [
          "invalidSchoolCode",
          "alreadySchoolMember",
          "joinRequestPending",
        ];
        if (!validationErrors.includes(errorMessage)) {
          console.error("Error joining school:", err);
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
    setSuccess(false);
  }, []);

  return {
    joinSchool: handleJoinSchool,
    isLoading,
    error,
    success,
    reset,
  };
};
