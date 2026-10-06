import { useEffect, useState } from "react";
import { SchoolRepository } from "@/modules/school/repositories";

/** Organization of a school (the product catalog an order picks from). */
export const useOrganizationIdOfSchool = (schoolId: string | undefined) => {
  const [organizationId, setOrganizationId] = useState<string | undefined>();

  useEffect(() => {
    if (!schoolId) {
      setOrganizationId(undefined);
      return;
    }
    let active = true;
    SchoolRepository.findById(schoolId)
      .then((school) => {
        if (active) setOrganizationId(school?.organizationId);
      })
      .catch((err) => console.error("[useOrganizationIdOfSchool] Load error:", err));
    return () => {
      active = false;
    };
  }, [schoolId]);

  return organizationId;
};
