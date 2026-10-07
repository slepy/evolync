import { StudentPaymentsScreen } from "@/modules/payments";
import { useStore } from "@/store";

/** Student's own payments in the active school (read-only). */
export default function UserPaymentsScreen() {
  const membership = useStore((state) => state.getActiveMembership());
  return <StudentPaymentsScreen memberId={membership?.memberId} />;
}
