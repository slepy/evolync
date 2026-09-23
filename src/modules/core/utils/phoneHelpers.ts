import { PHONE_PREFIXES, type PhoneValue } from "@/modules/core/components/PhoneInput";

/**
 * Parses a stored phone_number string (e.g. "+48123456789") into
 * { prefix, number } for use with the PhoneInput component.
 * Falls back to +48 prefix with empty number when input is empty.
 */
export function parsePhoneNumber(raw: string | undefined | null): PhoneValue {
  if (!raw) return { prefix: "+48", number: "" };

  // Sort longest first to correctly match e.g. +358 before +3
  const sorted = [...PHONE_PREFIXES].sort(
    (a, b) => b.code.length - a.code.length,
  );

  for (const p of sorted) {
    if (raw.startsWith(p.code)) {
      return { prefix: p.code, number: raw.slice(p.code.length) };
    }
  }

  return { prefix: "+48", number: raw.replace(/^\+\d+/, "") };
}

/**
 * Converts a { prefix, number } PhoneValue back to a stored string
 * (e.g. "+48123456789") or null when the number is empty.
 */
export function formatPhoneNumber(phone: PhoneValue | undefined | null): string | null {
  if (!phone || !phone.number) return null;
  return `${phone.prefix}${phone.number}`;
}
