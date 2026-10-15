import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { database } from "@/database";
import type AttendanceRecord from "@/database/models/AttendanceRecord";
import type TrainingSession from "@/database/models/TrainingSession";

// Network modules the service imports, replaced before it is required.
const stub = (request: string, exports: unknown) => {
  const resolved = require.resolve(request);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports } as any;
};
stub("@/database/sync", { sync: async () => ({ success: true, timestamp: Date.now() }) });
stub("@/config/supabase", { supabase: {} });

const service = require("../services/attendanceService") as typeof import("../services/attendanceService");
const { AttendanceRecordRepository, TrainingSessionRepository } =
  require("../repositories") as typeof import("../repositories");

const seedSession = (id: string, memberIds: string[]) =>
  database.write(async () => {
    await database.get<TrainingSession>("training_sessions").create((s) => {
      s._raw.id = id;
      s.schoolId = "school-1";
      s.sessionDate = new Date("2026-10-15T10:00:00Z");
    });
    for (const memberId of memberIds) {
      await database.get<AttendanceRecord>("attendance_records").create((r) => {
        r._raw.id = `${id}-${memberId}`;
        r.trainingSessionId = id;
        r.schoolMemberId = memberId;
        r.status = "present";
      });
    }
  });

describe("deleteTrainingSession", () => {
  beforeEach(async () => {
    await database.write(() => database.unsafeResetDatabase());
    await seedSession("s1", ["m1", "m2"]);
    await seedSession("s2", ["m1"]);
  });

  it("soft deletes the session and all of its attendance records", async () => {
    await service.deleteTrainingSession("s1");

    assert.equal(await TrainingSessionRepository.findById("s1"), null);
    assert.deepEqual(await AttendanceRecordRepository.findBySessionId("s1"), []);
    const session = await database.get<TrainingSession>("training_sessions").find("s1");
    const record = await database.get<AttendanceRecord>("attendance_records").find("s1-m1");
    assert.ok(session.deletedAt);
    assert.equal(record.deletedAt?.getTime(), session.deletedAt?.getTime());
  });

  it("leaves other sessions of the school untouched", async () => {
    await service.deleteTrainingSession("s1");

    const remaining = await TrainingSessionRepository.findBySchoolId("school-1");
    assert.deepEqual(
      remaining.map((s) => s.id),
      ["s2"],
    );
    assert.equal((await AttendanceRecordRepository.findBySessionId("s2")).length, 1);
  });

  it("rejects an unknown session without changing anything", async () => {
    await assert.rejects(service.deleteTrainingSession("missing"));
    assert.equal((await TrainingSessionRepository.findBySchoolId("school-1")).length, 2);
    assert.equal((await AttendanceRecordRepository.findBySessionId("s1")).length, 2);
  });
});
