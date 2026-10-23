import { useEffect, useState } from "react";
import { StudentRepository } from "@/modules/students/repositories";

export interface OrderMember {
  id: string;
  /** The member's own school (an event order is placed in it). */
  schoolId: string;
  name: string;
}

/** The member an order is fixed to (10D Add order): their school and name. */
export const useOrderMember = (memberId: string | undefined) => {
  const [member, setMember] = useState<OrderMember | undefined>();

  useEffect(() => {
    if (!memberId) {
      setMember(undefined);
      return;
    }
    let active = true;
    StudentRepository.findById(memberId)
      .then((m) => {
        if (active && m) {
          setMember({ id: m.id, schoolId: m.schoolId, name: m.displayName || m.email || t("unknownMember") });
        }
      })
      .catch((err) => console.error("[useOrderMember] Load error:", err));
    return () => {
      active = false;
    };
  }, [memberId]);

  return member;
};
