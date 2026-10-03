import type { SchoolAddressOption } from "../hooks/useSchoolsWithAddress";

export interface SchoolAddressItem extends SchoolAddressOption {
  disabled: boolean;
}

/** Schools without an address are listed but cannot be picked. */
export const toSchoolAddressItems = (schools: SchoolAddressOption[]): SchoolAddressItem[] =>
  schools.map((school) => ({ ...school, disabled: !school.address }));

/** The text pasted into the location field, or null for a disabled school. */
export const pickSchoolAddress = (item: SchoolAddressItem): string | null =>
  item.disabled ? null : item.address;
