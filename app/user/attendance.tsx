import { StudentAttendanceScreen } from "@/modules/attendance";
import { SchoolRepository } from "@/modules/school/repositories";
import { useStore } from "@/store";
import { useEffect, useState } from "react";

/** Student's own attendance in the active school (read-only). */
export default function UserAttendanceScreen() {
  const membership = useStore((state) => state.getActiveMembership());
  const [schoolName, setSchoolName] = useState<string>();

  useEffect(() => {
    if (!membership?.schoolId) return;
    SchoolRepository.findById(membership.schoolId)
      .then((school) => setSchoolName(school?.name))
      .catch(console.error);
  }, [membership?.schoolId]);

  return <StudentAttendanceScreen memberId={membership?.memberId} schoolName={schoolName} />;
}
