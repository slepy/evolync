import { TrashButton } from "@/core/components";
import TrainingSession from "@/database/models/TrainingSession";
import { LoadingScreen } from "@/core/components";
import { confirmDelete } from "@/core/utils/confirmDelete";
import React, { useEffect, useRef, useState } from "react";
import { useAttendance } from "../hooks/useAttendance";
import { TrainingSessionRepository } from "../repositories";
import { deleteTrainingSession } from "../services";
import { dateLocaleTag, formatSessionShort } from "../sessionList";
import { nextStatus } from "./sessionRow";
import { AttendanceSessionBody } from "./AttendanceSessionBody";

interface AttendanceSessionScreenProps {
  schoolId: string;
  sessionId: string;
  /** After Save or Delete: to the school's sessions (13A), whatever screen opened this one. */
  onSaved: () => void;
}

/** Session details (13B): tap a status to change it; Save appears after a change; the trash deletes the session. */
export const AttendanceSessionScreen: React.FC<AttendanceSessionScreenProps> = ({ schoolId, sessionId, onSaved }) => {
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { attendanceList, isLoading, isSaving, error, toggleStatus, saveAll, runAndLeave } = useAttendance(
    sessionId,
    schoolId,
  );
  // Set while Save / Delete runs and after it: the screen is leaving and must not re-render (Android black screen).
  const leavingRef = useRef(false);

  useEffect(() => {
    const subscription = TrainingSessionRepository.observeById(sessionId).subscribe({
      next: (next: TrainingSession) => {
        if (!leavingRef.current) setSession(next);
      },
      error: (err: Error) => console.error("[AttendanceSessionScreen] Load session error:", err),
    });
    return () => subscription.unsubscribe();
  }, [sessionId]);

  const changed = attendanceList.some((item) => item.record && item.status !== item.record.status);

  const handleSave = async () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    try {
      if (await saveAll()) onSaved();
      else leavingRef.current = false;
    } catch {
      leavingRef.current = false;
      // The hook keeps the error, shown above the button.
    }
  };

  const handleDelete = () =>
    confirmDelete(t("attendanceDeleteTitle"), t("attendanceDeleteMessage"), async () => {
      if (leavingRef.current) return;
      setIsDeleting(true);
      setDeleteError(null);
      leavingRef.current = true;
      try {
        if (await runAndLeave(() => deleteTrainingSession(sessionId))) onSaved();
        else leavingRef.current = false;
      } catch (err) {
        leavingRef.current = false;
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
      // Saved records change in place: keep Save (with its spinner) until the screen is gone.
      showButton={changed || isSaving}
      onSubmit={handleSave}
      isSaving={isSaving || isDeleting}
      error={deleteError ?? error}
      headerAction={
        <TrashButton label={t("attendanceDeleteTitle")} onPress={handleDelete} disabled={isSaving || isDeleting} />
      }
    />
  );
};
