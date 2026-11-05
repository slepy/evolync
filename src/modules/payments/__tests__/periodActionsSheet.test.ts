import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import TestRenderer, { type ReactTestRenderer, type ReactTestRendererJSON } from "react-test-renderer";

const host =
  (name: string) =>
  ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement(name, props, children);

const stub = (request: string, exports: unknown) => {
  const resolved = require.resolve(request);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports } as any;
};

stub("tamagui", { View: host("View"), Text: host("Text"), XStack: host("XStack"), YStack: host("YStack") });
stub("lucide-react-native", new Proxy({}, { get: (_, name) => host(String(name)) }));
const { ListRow } = require("@/core/components/List/ListRow") as typeof import("@/core/components/List/ListRow");
stub("@/core/components", {
  FormSheet: host("FormSheet"),
  ListCard: host("ListCard"),
  ListIcon: host("ListIcon"),
  ListRow,
});

const { PeriodActionsSheet } = require("../components/PeriodActionsSheet") as typeof import("../components/PeriodActionsSheet");

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

type Node = ReactTestRendererJSON;
const all = (node: Node | Node[] | null): Node[] => {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(all);
  return [node, ...(node.children ?? []).flatMap((c) => (typeof c === "string" ? [] : all(c)))];
};
const texts = (node: Node | Node[] | null): string[] =>
  all(node).flatMap((n) => (n.children ?? []).filter((c): c is string => typeof c === "string"));
/** The pressable row element of an action, found by its title. */
const row = (tree: Node | Node[] | null, title: string) => {
  const found = all(tree).find((n) => n.props["aria-label"] === title);
  assert.ok(found, title);
  return found;
};

const render = (props: Partial<React.ComponentProps<typeof PeriodActionsSheet>> = {}) => {
  const calls: string[] = [];
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      React.createElement(PeriodActionsSheet, {
        open: true,
        onOpenChange: (open) => calls.push(`open:${open}`),
        title: "October 2026",
        locked: false,
        changed: false,
        deletable: { ok: true },
        onToggleLock: () => calls.push("lock"),
        onDelete: () => calls.push("delete"),
        ...props,
      }),
    );
  });
  return { tree: renderer.toJSON(), calls };
};

describe("PeriodActionsSheet", () => {
  it("Lock and Delete both run when the period is unlocked and nothing is paid", () => {
    const { tree, calls } = render();
    act(() => row(tree, "paymentsLock").props.onPress());
    act(() => row(tree, "paymentsDeletePeriod").props.onPress());
    assert.deepEqual(calls, ["open:false", "lock", "open:false", "delete"]);
    assert.equal(row(tree, "paymentsDeletePeriod").props["aria-disabled"], undefined);
  });

  it("Lock waits for Save while the screen has unsaved changes", () => {
    const { tree } = render({ changed: true });
    const lock = row(tree, "paymentsLock");
    assert.equal(lock.props["aria-disabled"], true);
    assert.equal(lock.props.onPress, undefined);
    assert.equal(lock.props.opacity, 0.45);
    assert.ok(texts(tree).includes("paymentsLockSaveFirst"));
  });

  it("Delete is dimmed with the paid reason while something is paid", () => {
    const { tree } = render({ deletable: { ok: false, reason: "paid", count: 2 } });
    const del = row(tree, "paymentsDeletePeriod");
    assert.equal(del.props["aria-disabled"], true);
    assert.equal(del.props.onPress, undefined);
    assert.ok(texts(tree).includes("paymentsDeleteBlockedPaid"));
  });

  it("a locked period offers Unlock and blocks Delete until it is unlocked", () => {
    const { tree, calls } = render({ locked: true, changed: true, deletable: { ok: false, reason: "locked" } });
    act(() => row(tree, "paymentsUnlock").props.onPress());
    assert.deepEqual(calls, ["open:false", "lock"]);
    assert.ok(texts(tree).includes("paymentsUnlockHint"));
    assert.ok(texts(tree).includes("paymentsDeleteBlockedLocked"));
  });
});
