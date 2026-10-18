import type { PhoneValue } from "@/core/utils/phonePrefixes";
import { formatPhoneNumber, parsePhoneNumber } from "@/core/utils/phoneHelpers";

/** Values of the Profile tab (P1 / P2). */
export interface ProfileValues {
  fullName: string;
  /** Remote URL, local file URI of a new photo, or null. */
  avatarUrl: string | null;
  phone: PhoneValue;
}

/** Auth user metadata the profile lives in (`supabase.auth.updateUser({ data })`). */
export interface ProfileMetadata {
  full_name: string;
  avatar_url: string | null;
  phone_number: string | null;
}

/** Profile values of the signed-in user, from the auth user metadata. */
export function profileValuesFromUser(user: { id?: string; user_metadata?: Record<string, unknown> | null } | null | undefined): ProfileValues {
  const meta = user?.user_metadata ?? {};
  return {
    fullName: typeof meta.full_name === "string" ? meta.full_name : "",
    avatarUrl: typeof meta.avatar_url === "string" && meta.avatar_url ? meta.avatar_url : null,
    phone: parsePhoneNumber(typeof meta.phone_number === "string" ? meta.phone_number : null),
  };
}

/** A photo picked on this device that still has to be uploaded. */
export function isLocalPhoto(uri: string | null): uri is string {
  return !!uri && !/^https?:\/\//.test(uri);
}

/** Metadata to save: trimmed name, uploaded photo URL, phone as "+48601234567" or null. */
export function toProfileMetadata(values: ProfileValues, avatarUrl: string | null): ProfileMetadata {
  return {
    full_name: values.fullName.trim(),
    avatar_url: avatarUrl,
    phone_number: formatPhoneNumber(values.phone),
  };
}
