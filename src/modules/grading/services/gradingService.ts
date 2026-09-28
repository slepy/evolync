import { database } from "@/database";
import type GradingRank from "@/database/models/GradingRank";
import { sync } from "@/database/sync";
import { StudentRepository } from "@/modules/students/repositories";
import type { CreateRankDto, UpdateRankDto } from "../types";
import { GradingRankRepository } from "../repositories";

export const findRankById = (
  ranks: GradingRank[],
  rankId?: string | null,
): GradingRank | undefined => {
  if (!rankId) return undefined;
  return ranks.find((r) => r.id === rankId);
};

const assertUniqueName = (
  existing: GradingRank[],
  name: string,
  excludeRankId?: string,
): void => {
  const normalized = name.trim().toLowerCase();
  const duplicate = existing.some(
    (r) => r.id !== excludeRankId && r.name.trim().toLowerCase() === normalized,
  );
  if (duplicate) {
    throw new Error("gradingErrorDuplicateName");
  }
};

export const addRank = async (
  organizationId: string,
  data: CreateRankDto,
): Promise<void> => {
  const existing = await GradingRankRepository.findByOrganizationId(organizationId);
  assertUniqueName(existing, data.name);
  const maxOrder = existing.reduce((max, r) => Math.max(max, r.order), 0);

  await GradingRankRepository.create({
    organizationId,
    name: data.name,
    order: maxOrder + 1,
    color: data.color,
  });

  sync().catch(console.error);
};

export const updateRank = async (
  organizationId: string,
  rankId: string,
  data: UpdateRankDto,
): Promise<void> => {
  if (data.name) {
    const existing = await GradingRankRepository.findByOrganizationId(organizationId);
    assertUniqueName(existing, data.name, rankId);
  }

  await GradingRankRepository.update(rankId, data);
  sync().catch(console.error);
};

export const deleteRank = async (
  organizationId: string,
  rankId: string,
): Promise<void> => {
  const all = await GradingRankRepository.findByOrganizationId(organizationId);
  const toDelete = all.find((r) => r.id === rankId);
  if (!toDelete) return;

  const remaining = all.filter((r) => r.id !== rankId);
  const now = new Date();

  const affectedMembers = await StudentRepository.findByCurrentRankId(rankId);

  await database.write(async () => {
    await database.batch(
      toDelete.prepareUpdate((r) => { r.deletedAt = now; }),
      ...remaining.map((rank, index) =>
        rank.prepareUpdate((r) => { r.order = index + 1; }),
      ),
      ...affectedMembers.map((member) =>
        member.prepareUpdate((m) => { m.currentRankId = undefined; }),
      ),
    );
  });

  sync().catch(console.error);
};
