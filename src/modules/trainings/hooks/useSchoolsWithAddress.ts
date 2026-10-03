import { SchoolRepository } from "@/modules/school/repositories";
import { map } from "rxjs/operators";
import { useObservableValue } from "./useObservableList";

export interface SchoolAddressOption {
  id: string;
  name: string;
  address: string | null;
}

const EMPTY: SchoolAddressOption[] = [];

/** The organization's schools with their (possibly missing) address. */
export const useSchoolsWithAddress = (organizationId: string | undefined) => {
  const { value, isLoading } = useObservableValue(
    () =>
      organizationId
        ? SchoolRepository.observeByOrganizationId(organizationId).pipe(
            map((schools) =>
              schools
                .map((s) => ({ id: s.id, name: s.name, address: s.address?.trim() || null }))
                .sort((a, b) => a.name.localeCompare(b.name)),
            ),
          )
        : null,
    EMPTY,
    [organizationId],
    "useSchoolsWithAddress",
  );
  return { schools: value, isLoading };
};
