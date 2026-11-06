import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import TestRenderer, { type ReactTestRenderer } from "react-test-renderer";
import { database } from "@/database";
import type AttendanceRecord from "@/database/models/AttendanceRecord";
import type SchoolMember from "@/database/models/SchoolMember";
import type TrainingSession from "@/database/models/TrainingSession";

const host =
  (name: string) =>
  ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement(name, props, children);

const stub = (request: string, exports: unknown) => {
  const resolved = require.resolve(request);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports } as any;
};
stub("@/database/sync", { sync: async () => ({ success: true, timestamp: Date.now() }) });
stub("@/config/supabase", { supabase: {} });
stub("@/store", { useStore: () => ({ performSync: async () => {} }) });
// The confirmation alert answers Delete at once.
stub("@/core/utils/confirmDelete", { confirmDelete: (_t: string, _m: string, onConfirm: () => void) => onConfirm() });
stub("tamagui", { View: host("View"), Text: host("Text"), XStack: host("XStack"), YStack: host("YStack") });
stub("lucide-react-native", new Proxy({}, { get: (_, name) => host(String(name)) }));
stub(
  "@/core/components",
  new Proxy({ ratePercent: (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0) } as Record<string, unknown>, {
    get: (target, name) => target[name as string] ?? host(String(name)),
  }),
);

const { AttendanceSessionScreen } =
  require("../components/AttendanceSessionScreen") as typeof import("../components/AttendanceSessionScreen");
const { AttendanceRecordRepository } = require("../repositories") as typeof import("../repositories");
// The hook calls it through the services barrel, which reads this module's live export.
const services = require("../services/attendanceService") as Record<string, unknown>;

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));

type Props = Record<string, any>;
const bodyProps = (renderer: ReactTestRenderer): Props =>
  (renderer as any).root.find(
    (n: { type: unknown; props: Props }) => typeof n.type === "function" && n.props.buttonLabel !== undefined,
  ).props;
/** What the screen shows: Save visible, row statuses. */
const shown = (p: Props) => ({ showButton: p.showButton, statuses: p.rows.map((r: { status: string }) => r.status) });

const mount = async () => {
  let saved = 0;
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(
      React.createElement(AttendanceSessionScreen, {
        schoolId: "school-1",
        sessionId: "s1",
        onSaved: () => {
          saved += 1;
        },
      }),
    );
    await wait();
  });
  return { renderer, saved: () => saved };
};

describe("AttendanceSessionScreen", () => {
  beforeEach(async () => {
    await database.write(() => database.unsafeResetDatabase());
    await database.write(async () => {
      await database.get<TrainingSession>("training_sessions").create((s) => {
        s._raw.id = "s1";
        s.schoolId = "school-1";
        s.sessionDate = new Date("2026-11-05T00:00:00Z");
      });
      for (const id of ["m1", "m2"]) {
        await database.get<SchoolMember>("school_members").create((m: any) => {
          m._raw.id = id;
          m._raw.school_id = "school-1";
          m._raw.status = "active";
          m._raw.display_name = id;
        });
        await database.get<AttendanceRecord>("attendance_records").create((r) => {
          r._raw.id = `s1-${id}`;
          r.trainingSessionId = "s1";
          r.schoolMemberId = id;
          r.status = "present";
        });
      }
    });
  });

  it("Save stores the change and leaves without re-rendering the list (Android black screen)", async () => {
    const { renderer, saved } = await mount();
    await act(async () => {
      bodyProps(renderer).onToggle("m1");
    });
    const before = shown(bodyProps(renderer));
    assert.deepEqual(before, { showButton: true, statuses: ["absent", "present"] });

    await act(async () => {
      const submit = bodyProps(renderer).onSubmit;
      submit();
      submit();
      await wait(200);
    });

    assert.equal(saved(), 1);
    assert.deepEqual(shown(bodyProps(renderer)), before);
    const records = await AttendanceRecordRepository.findBySessionId("s1");
    assert.deepEqual(records.map((r) => [r.schoolMemberId, r.status]).sort(), [
      ["m1", "absent"],
      ["m2", "present"],
    ]);
    act(() => renderer.unmount());
  });

  it("a failed Save stays on the screen with the error and keeps the unsaved status", async () => {
    const original = services.bulkSaveAttendanceList;
    services.bulkSaveAttendanceList = async () => {
      throw new Error("disk full");
    };
    try {
      const { renderer, saved } = await mount();
      await act(async () => {
        bodyProps(renderer).onToggle("m1");
      });
      await act(async () => {
        bodyProps(renderer).onSubmit();
        await wait(200);
      });

      const p = bodyProps(renderer);
      assert.equal(saved(), 0);
      assert.equal(p.error, "disk full");
      assert.equal(p.isSaving, false);
      assert.deepEqual(shown(p), { showButton: true, statuses: ["absent", "present"] });
      act(() => renderer.unmount());
    } finally {
      services.bulkSaveAttendanceList = original;
    }
  });

  it("Delete removes the session and leaves without emptying the list", async () => {
    const { renderer, saved } = await mount();
    const before = shown(bodyProps(renderer));
    await act(async () => {
      bodyProps(renderer).headerAction.props.onPress();
      await wait(200);
    });

    assert.equal(saved(), 1);
    assert.deepEqual(shown(bodyProps(renderer)), before);
    assert.deepEqual(await AttendanceRecordRepository.findBySessionId("s1"), []);
    act(() => renderer.unmount());
  });
});
