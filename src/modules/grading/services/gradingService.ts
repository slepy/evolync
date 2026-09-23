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

export const addRank = async (
  organizationId: string,
  data: CreateRankDto,
): Promise<void> => {
  const existing = await GradingRankRepository.findByOrganizationId(organizationId);
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
  rankId: string,
  data: UpdateRankDto,
): Promise<void> => {
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

  await database.write(async () => {
    await database.batch(
      toDelete.prepareUpdate((r) => { r.deletedAt = now; }),
      ...remaining.map((rank, index) =>
        rank.prepareUpdate((r) => { r.order = index + 1; }),
      ),
    );
  });

  sync().catch(console.error);
};

export const reorderRanks = async (
  organizationId: string,
  orderedRankIds: string[],
): Promise<void> => {
  const ranks = await GradingRankRepository.findByOrganizationId(organizationId);
  const ranksMap = new Map(ranks.map((r) => [r.id, r]));

  await database.write(async () => {
    await database.batch(
      orderedRankIds
        .map((id, index) => {
          const rank = ranksMap.get(id);
          if (!rank) return null;
          return rank.prepareUpdate((r) => {
            r.order = index + 1;
          });
        })
        .filter(Boolean) as any[],
    );
  });

  sync().catch(console.error);
};

interface SaveRankItem {
  id: string;
  name: string;
  color?: string;
  order: number;
  isNew?: boolean;
}

export const saveGradingConfig = async (
  organizationId: string,
  ranks: SaveRankItem[],
  deletedIds: string[],
): Promise<void> => {
  const existingRanks = await GradingRankRepository.findByOrganizationId(organizationId);
  const existingMap = new Map(existingRanks.map((r) => [r.id, r]));
  const deletedSet = new Set(deletedIds);
  const collection = database.get<GradingRank>("organization_gradings");
  const now = new Date();

  const ops: ReturnType<GradingRank["prepareUpdate"]>[] = [];

  for (const r of existingRanks) {
    if (deletedSet.has(r.id)) {
      ops.push(r.prepareUpdate((rec) => { rec.deletedAt = now; }));
    }
  }

  for (const rank of ranks) {
    if (rank.isNew) {
      ops.push(
        collection.prepareCreate((rec) => {
          rec._raw.id = rank.id;
          rec.organizationId = organizationId;
          rec.name = rank.name;
          rec.order = rank.order;
          if (rank.color) rec.color = rank.color;
        }) as any,
      );
    } else {
      const existing = existingMap.get(rank.id);
      if (!existing) continue;
      const needsUpdate =
        existing.name !== rank.name ||
        (existing.color || undefined) !== (rank.color || undefined) ||
        existing.order !== rank.order;
      if (needsUpdate) {
        ops.push(
          existing.prepareUpdate((rec) => {
            rec.name = rank.name;
            rec.order = rank.order;
            if (rank.color !== undefined) rec.color = rank.color ?? rec.color;
          }),
        );
      }
    }
  }

  if (ops.length > 0) {
    await database.write(async () => {
      await database.batch(...ops);
    });
  }

  sync().catch(console.error);
};

export const assignRankToStudent = async (
  studentId: string,
  rankId: string | null,
): Promise<void> => {
  await StudentRepository.update(studentId, {
    currentRankId: rankId ?? undefined,
  } as any);

  sync().catch(console.error);
};
