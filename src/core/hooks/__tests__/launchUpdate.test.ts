import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runLaunchUpdate, type LaunchUpdateDeps, type LaunchUpdatePhase } from "@/core/hooks/launchUpdate";

const never = <T>() => new Promise<T>(() => {});

function setup(overrides: Partial<LaunchUpdateDeps> = {}) {
  const phases: LaunchUpdatePhase[] = [];
  const calls: string[] = [];
  const errors: unknown[] = [];
  const deps: LaunchUpdateDeps = {
    isEnabled: true,
    isOnline: async () => true,
    checkForUpdate: async () => {
      calls.push("check");
      return { isAvailable: true };
    },
    fetchUpdate: async () => {
      calls.push("fetch");
      return { isNew: true };
    },
    reload: async () => {
      calls.push("reload");
    },
    onPhase: (phase) => phases.push(phase),
    onError: (error) => errors.push(error),
    ...overrides,
  };
  return { deps, phases, calls, errors };
}

const fast = { checkMs: 20, fetchMs: 20 };

describe("runLaunchUpdate", () => {
  it("downloads a newer bundle and reloads onto it, staying on the launch screen", async () => {
    const { deps, phases, calls } = setup();
    await runLaunchUpdate(deps, fast);
    assert.deepEqual(calls, ["check", "fetch", "reload"]);
    assert.deepEqual(phases, ["updating"]);
  });

  it("opens the current bundle when the channel has nothing newer", async () => {
    const { deps, phases, calls } = setup({ checkForUpdate: async () => ({ isAvailable: false }) });
    await runLaunchUpdate(deps, fast);
    assert.deepEqual(calls, []);
    assert.deepEqual(phases, ["done"]);
  });

  it("never checks in the dev client, Expo Go or on web", async () => {
    const { deps, phases, calls } = setup({ isEnabled: false });
    await runLaunchUpdate(deps, fast);
    assert.deepEqual(calls, []);
    assert.deepEqual(phases, ["done"]);
  });

  it("never checks offline", async () => {
    const { deps, phases, calls } = setup({ isOnline: async () => false });
    await runLaunchUpdate(deps, fast);
    assert.deepEqual(calls, []);
    assert.deepEqual(phases, ["done"]);
  });

  it("opens the current bundle when the check times out", async () => {
    const { deps, phases, errors } = setup({ checkForUpdate: never });
    await runLaunchUpdate(deps, fast);
    assert.deepEqual(phases, ["done"]);
    assert.equal(errors.length, 1);
  });

  it("opens the current bundle when the download times out", async () => {
    const { deps, phases, calls, errors } = setup({ fetchUpdate: never });
    await runLaunchUpdate(deps, fast);
    assert.deepEqual(calls, ["check"]);
    assert.deepEqual(phases, ["updating", "done"]);
    assert.equal(errors.length, 1);
  });

  it("opens the current bundle when the download brings nothing new", async () => {
    const { deps, phases, calls } = setup({ fetchUpdate: async () => ({ isNew: false }) });
    await runLaunchUpdate(deps, fast);
    assert.deepEqual(calls, ["check"]);
    assert.deepEqual(phases, ["updating", "done"]);
  });

  it("opens the current bundle when the check or the reload fails", async () => {
    for (const failing of ["checkForUpdate", "reload"] as const) {
      const { deps, phases, errors } = setup({
        [failing]: async () => {
          throw new Error("network");
        },
      });
      await runLaunchUpdate(deps, fast);
      assert.equal(phases.at(-1), "done");
      assert.equal(errors.length, 1);
    }
  });
});
