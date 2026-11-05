import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import TestRenderer, { type ReactTestRenderer } from "react-test-renderer";
import { database } from "@/database";
import type SchoolMember from "@/database/models/SchoolMember";

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
stub("tamagui", { View: host("View"), Text: host("Text"), XStack: host("XStack"), YStack: host("YStack") });
stub("lucide-react-native", new Proxy({}, { get: (_, name) => host(String(name)) }));
stub(
  "@/core/components",
  new Proxy({ ratePercent: (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0) } as Record<string, unknown>, {
    get: (target, name) => target[name as string] ?? host(String(name)),
  }),
);

const { AttendanceCreateScreen } =
  require("../components/AttendanceCreateScreen") as typeof import("../components/AttendanceCreateScreen");
const { TrainingSessionRepository } = require("../repositories") as typeof import("../repositories");

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));

/** Props the screen passes to AttendanceSessionBody, after every render. */
const bodyProps = (renderer: ReactTestRenderer) =>
  (renderer as any).root.find(
    (n: { type: unknown; props: Record<string, unknown> }) => typeof n.type === "function" && n.props.buttonLabel !== undefined,
  ).props;

const mount = async () => {
  let created = 0;
  const bodies: Array<{ buttonLabel: string; anyDisabled: boolean }> = [];
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(
      React.createElement(AttendanceCreateScreen, {
        schoolId: "school-1",
        onCreated: () => {
          created += 1;
          // Record what the screen shows from the Create tap until it is popped.
          const p = bodyProps(renderer);
          bodies.push({ buttonLabel: p.buttonLabel, anyDisabled: p.rows.some((r: { disabled: boolean }) => r.disabled) });
        },
        onOpenSession: () => {},
      }),
    );
    await wait();
  });
  return { renderer, created: () => created, bodies };
};

describe("AttendanceCreateScreen", () => {
  beforeEach(async () => {
    await database.write(() => database.unsafeResetDatabase());
    await database.write(async () => {
      for (const id of ["m1", "m2"]) {
        await database.get<SchoolMember>("school_members").create((m: any) => {
          m._raw.id = id;
          m._raw.school_id = "school-1";
          m._raw.status = "active";
          m._raw.display_name = id;
        });
      }
    });
  });

  it("does not flip to 'session exists' while Create saves and leaves (Android crash)", async () => {
    const { renderer, created, bodies } = await mount();
    const labels: string[] = [];
    await act(async () => {
      bodyProps(renderer).onSubmit();
      await wait(200);
    });
    labels.push(bodyProps(renderer).buttonLabel);
    assert.equal(created(), 1);
    assert.deepEqual(bodies, [{ buttonLabel: "create", anyDisabled: false }]);
    assert.deepEqual(labels, ["create"]);
    assert.equal((await TrainingSessionRepository.findBySchoolId("school-1")).length, 1);
    act(() => renderer.unmount());
  });

  it("a double tap on Create saves one session", async () => {
    const { renderer, created } = await mount();
    await act(async () => {
      const submit = bodyProps(renderer).onSubmit;
      submit();
      submit();
      await wait(200);
    });
    assert.equal(created(), 1);
    assert.equal((await TrainingSessionRepository.findBySchoolId("school-1")).length, 1);
    act(() => renderer.unmount());
  });
});
