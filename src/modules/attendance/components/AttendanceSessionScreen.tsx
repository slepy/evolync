import { TrashButton } from "@/core/components";
import TrainingSession from "@/database/models/TrainingSession";
import { LoadingScreen } from "@/core/components";
import { confirmDelete } from "@/core/utils/confirmDelete";
import React, { useEffect, useState } from "react";
import { useAttendance } from "../hooks/useAttendance";
import { TrainingSessionRepository } from "../repositories";
import { deleteTrainingSession } from "../services";
import { dateLocaleTag, formatSessionShort } from "../sessionList";
import { nextStatus } from "./sessionRow";
import { AttendanceSessionBody } from "./AttendanceSessionBody";

interface AttendanceSessionScreenProps {
  schoolId: string;
  sessionId: string;
  /** After Save or Delete: back to the sessions. */
  onSaved: () => void;
}

/** Session details (13B): tap a status to change it; Save appears after a change; the trash deletes the session. */
export const AttendanceSessionScreen: React.FC<AttendanceSessionScreenProps> = ({ schoolId, sessionId, onSaved }) => {
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { attendanceList, isLoading, isSaving, error, toggleStatus, saveAll } = useAttendance(sessionId, schoolId);

  useEffect(() => {
    const subscription = TrainingSessionRepository.observeById(sessionId).subscribe({
      next: setSession,
      error: (err: Error) => console.error("[AttendanceSessionScreen] Load session error:", err),
    });
    return () => subscription.unsubscribe();
  }, [sessionId]);

  const changed = attendanceList.some((item) => item.record && item.status !== item.record.status);

  const handleSave = async () => {
    try {
      await saveAll();
      onSaved();
    } catch {
      // The hook keeps the error, shown above the button.
    }
  };

  const handleDelete = () =>
    confirmDelete(t("attendanceDeleteTitle"), t("attendanceDeleteMessage"), async () => {
      setIsDeleting(true);
      setDeleteError(null);
      try {
        await deleteTrainingSession(sessionId);
        onSaved();
      } catch (err) {
        console.error("[AttendanceSessionScreen] Delete error:", err);
        setDeleteError(t("errorDeleteFailed"));
        setIsDeleting(false);
      }
    });

  if (isLoading || !session) return <LoadingScreen />;

  return (
    <AttendanceSessionBody
      title={formatSessionShort(session.sessionDate, dateLocaleTag(t("locale")))}
      rows={attendanceList}
      onToggle={(memberId) => {
        const item = attendanceList.find((i) => i.member.id === memberId);
        if (item) toggleStatus(memberId, nextStatus(item.status));
      }}
      buttonLabel={t("save")}
      showButton={changed}
      onSubmit={handleSave}
      isSaving={isSaving || isDeleting}
      error={deleteError ?? error}
      headerAction={
        <TrashButton label={t("attendanceDeleteTitle")} onPress={handleDelete} disabled={isSaving || isDeleting} />
      }
    />
  );
};
