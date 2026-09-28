import { sync } from "@/database/sync";
import { useStore } from "@/store";
import * as Crypto from "expo-crypto";
import { SchoolInviteRepository } from "../repositories/schoolInviteRepository";

const CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 6;
const MAX_GENERATION_ATTEMPTS = 5;

const generateInviteCode = (): string => {
  const bytes = Crypto.getRandomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
};

const generateUniqueInviteCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const code = generateInviteCode();
    const existing = await SchoolInviteRepository.findByCode(code);
    if (!existing) {
      return code;
    }
  }
  throw new Error("inviteCodeGenerationFailed");
};

/**
 * Creates a new school invite in the local database
 * Enforces one active invite per school rule by invalidating existing ones.
 *
 * @param schoolId - ID of the school to create invite for
 * @param expiresAt - Expiration timestamp
 * @returns Promise<SchoolInvite> - Created invite model
 */
export const createInvite = async (
  schoolId: string,
  expiresAt: number,
): Promise<any> => {
  const { user } = useStore.getState();
  if (!user?.id) {
    throw new Error("User must be logged in to create an invite");
  }
  const code = await generateUniqueInviteCode();
  await SchoolInviteRepository.invalidateActiveInvites(schoolId);
  const invite = await SchoolInviteRepository.create({
    schoolId,
    code,
    expiresAt,
    createdBy: user.id,
  });
  sync().catch((err) => {
    console.error("[inviteService] Sync after create failed:", err);
  });
  return invite;
};
