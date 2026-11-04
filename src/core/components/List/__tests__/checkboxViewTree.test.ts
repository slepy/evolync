import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import TestRenderer, { type ReactTestRenderer, type ReactTestRendererJSON } from "react-test-renderer";

/**
 * A box checked after the first render used to disappear on device: the
 * unchecked and checked states were different view trees, so toggling
 * mounted a LinearGradient into a reused native view. Both controls must
 * keep one view tree and switch states by opacity only.
 */

const host =
  (name: string) =>
  ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement(name, props, children);

const stub = (request: string, exports: unknown) => {
  const resolved = require.resolve(request);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports } as any;
};

stub("tamagui", { View: host("View"), Text: host("Text"), XStack: host("XStack"), YStack: host("YStack") });
stub("expo-linear-gradient", { LinearGradient: host("LinearGradient") });
stub("lucide-react-native", { Check: host("Check") });
stub("react-native", { StyleSheet: { absoluteFill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } } });

const { ListCheckbox } = require("@/core/components/List/ListCheckbox") as typeof import("@/core/components/List/ListCheckbox");
const { ChoiceList } = require("@/core/components/ChoiceList/ChoiceList") as typeof import("@/core/components/ChoiceList/ChoiceList");

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

type Node = ReactTestRendererJSON;

/** Element types of the whole tree, props left out. */
const shape = (node: Node | Node[] | string | null): unknown =>
  node === null || typeof node === "string"
    ? node === null ? null : "#text"
    : Array.isArray(node)
      ? node.map(shape)
      : { type: node.type, children: (node.children ?? []).map((c) => shape(c as Node | string)) };

const find = (node: Node | Node[] | null, type: string): Node[] => {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap((n) => find(n, type));
  const own = node.type === type ? [node] : [];
  return own.concat((node.children ?? []).flatMap((c) => (typeof c === "string" ? [] : find(c, type))));
};

const opacityOf = (node: Node) => {
  const style = node.props.style;
  const flat = Array.isArray(style) ? Object.assign({}, ...style) : style;
  return flat?.opacity ?? node.props.opacity;
};

function render(element: React.ReactElement) {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(element);
  });
  return renderer;
}

describe("ListCheckbox", () => {
  it("keeps one view tree when toggled and shows the gradient only when checked", () => {
    const renderer = render(React.createElement(ListCheckbox, { checked: false, accent: "events" }));
    const unchecked = renderer.toJSON() as Node;
    assert.equal(opacityOf(find(unchecked, "LinearGradient")[0]), 0);

    act(() => renderer.update(React.createElement(ListCheckbox, { checked: true, accent: "events" })));
    const checked = renderer.toJSON() as Node;

    assert.deepEqual(shape(checked), shape(unchecked));
    assert.equal(find(checked, "LinearGradient").length, 1);
    assert.equal(opacityOf(find(checked, "LinearGradient")[0]), 1);
  });
});

describe("ChoiceList radio", () => {
  it("keeps one view tree when the selection moves", () => {
    const props = {
      options: [
        { value: "a", title: "A" },
        { value: "b", title: "B" },
      ],
      onChange: () => {},
    };
    const renderer = render(React.createElement(ChoiceList<string>, { ...props, value: "a" }));
    const before = renderer.toJSON() as Node;

    act(() => renderer.update(React.createElement(ChoiceList<string>, { ...props, value: "b" })));
    const after = renderer.toJSON() as Node;

    assert.deepEqual(shape(after), shape(before));
    const gradients = find(after, "LinearGradient");
    assert.equal(gradients.length, 2);
    assert.deepEqual(gradients.map(opacityOf), [0, 1]);
  });
});
