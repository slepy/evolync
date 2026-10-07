/** Known join errors → alert title and message keys; anything else is the generic error. */
const ERROR_TEXT: Record<string, { title: string; message: string }> = {
  invalidSchoolCode: { title: "invalidSchoolCode", message: "invalidSchoolCodeMessage" },
  alreadySchoolMember: { title: "alreadySchoolMember", message: "alreadySchoolMemberMessage" },
  joinRequestPending: { title: "joinRequestPending", message: "joinRequestPendingMessage" },
};

/** Translation keys of the Join a school alert for a `useJoinSchool` error; null when there is none. */
export function joinSchoolErrorText(error: string | null): { title: string; message: string } | null {
  if (!error) return null;
  return ERROR_TEXT[error] ?? { title: "error", message: "errorUnknown" };
}
