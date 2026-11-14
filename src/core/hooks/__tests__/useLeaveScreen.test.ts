import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import TestRenderer, { type ReactTestRenderer } from "react-test-renderer";
import { useLeaveScreen } from "../useLeaveScreen";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

type Api = ReturnType<typeof useLeaveScreen>;

/** A screen showing `label` (as if observed from the database) and whether it is leaving. */
const mount = async () => {
  let api!: Api;
  let setLabel!: (label: string) => void;
  const Screen = () => {
    const [label, set] = React.useState("unsaved");
    setLabel = set;
    api = useLeaveScreen();
    return api.hold(React.createElement("View", { label, leaving: api.leaving }));
  };
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(React.createElement(Screen));
  });
  const shown = () => (renderer as any).root.findByType("View").props as { label: string; leaving: boolean };
  return { api: () => api, setLabel: (l: string) => setLabel(l), shown, renderer };
};

describe("useLeaveScreen", () => {
  it("keeps the view from when leaving started while the action writes, then leaves once", async () => {
    const { api, setLabel, shown, renderer } = await mount();
    let left = 0;
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const action = async () => {
      await gate; // the database write
      setLabel("saved"); // the records re-emit
    };
    let first!: Promise<boolean>;
    // The tap: Save shows its spinner before the write.
    await act(async () => {
      first = api().leave(action, () => (left += 1));
    });
    assert.deepEqual(shown(), { label: "unsaved", leaving: true });
    await act(async () => {
      assert.equal(await api().leave(action, () => (left += 1)), false, "a second tap is ignored");
      release();
      assert.equal(await first, true);
    });
    assert.equal(left, 1);
    assert.deepEqual(shown(), { label: "unsaved", leaving: true });
    act(() => renderer.unmount());
  });

  it("releases the view when the action fails and shows what arrived", async () => {
    const { api, setLabel, shown, renderer } = await mount();
    let left = 0;
    await act(async () => {
      await assert.rejects(
        api().leave(async () => {
          setLabel("changed elsewhere");
          throw new Error("errorSaveFailed");
        }, () => (left += 1)),
      );
    });
    assert.equal(left, 0);
    assert.deepEqual(shown(), { label: "changed elsewhere", leaving: false });

    await act(async () => {
      assert.equal(await api().leave(async () => false, () => (left += 1)), false);
    });
    assert.equal(left, 0, "an action resolving to false stays");
    assert.equal(shown().leaving, false);
    act(() => renderer.unmount());
  });
});
