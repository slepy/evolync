import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import TestRenderer, { type ReactTestRenderer, type ReactTestRendererJSON } from "react-test-renderer";

/**
 * Event list (organization calendar, List view): a tap on a participant of an
 * expanded event opens the event's Participants screen. The participants are
 * the `ListRow` children, outside the row's own pressable, so each one must be
 * its own button.
 */

const host =
  (name: string) =>
  ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement(name, props, children);

const stub = (request: string, exports: unknown) => {
  const resolved = require.resolve(request);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports } as any;
};

stub("tamagui", { Text: host("Text"), XStack: host("XStack"), YStack: host("YStack") });
stub("react-native", { ActivityIndicator: host("ActivityIndicator") });
stub("@/core/components", { MemberAvatar: host("MemberAvatar") });
stub("@/core/theme/tokens", { moduleAccents: { events: { tint: "events-tint" } } });
stub(require.resolve("../components/ParticipantStatusIcon"), { ParticipantStatusIcon: host("ParticipantStatusIcon") });

(globalThis as any).t = (key: string) => key;
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const { EventRowParticipantsView } =
  require("../components/EventRowParticipantsView") as typeof import("../components/EventRowParticipantsView");

const participants = [
  { id: "p1", name: "Anna Nowak", avatarUrl: null, rankId: "r1", status: "paid" as const },
  { id: "p2", name: "Jan Kowalski", status: "absent" as const },
];

function render(props: Partial<React.ComponentProps<typeof EventRowParticipantsView>> & { onParticipantPress: () => void }) {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      React.createElement(EventRowParticipantsView, { participants, isLoading: false, ...props }),
    );
  });
  return renderer;
}

type Node = ReactTestRendererJSON;

/** Host nodes of the rendered tree matching `match`. */
const findAll = (renderer: ReactTestRenderer, match: (node: Node) => boolean): Node[] => {
  const walk = (node: Node | Node[] | string | null): Node[] => {
    if (node === null || typeof node === "string") return [];
    if (Array.isArray(node)) return node.flatMap(walk);
    return (match(node) ? [node] : []).concat((node.children ?? []).flatMap(walk));
  };
  return walk(renderer.toJSON());
};

const buttons = (renderer: ReactTestRenderer) => findAll(renderer, (node) => node.props.role === "button");

describe("EventRowParticipantsView", () => {
  it("makes every participant a button that opens the Participants screen", () => {
    let presses = 0;
    const renderer = render({ onParticipantPress: () => presses++ });
    const rows = buttons(renderer);

    assert.deepEqual(
      rows.map((row) => row.props["aria-label"]),
      ["Anna Nowak", "Jan Kowalski"],
    );
    rows.forEach((row) => assert.equal(row.props.accessibilityHint, "eventsManageParticipants"));
    assert.equal(findAll(renderer, (node) => node.props.role === "listitem").length, 2);

    act(() => rows[1].props.onPress());
    act(() => rows[0].props.onPress());
    assert.equal(presses, 2);
  });

  it("keeps the empty and loading states unpressable", () => {
    const noop = () => assert.fail("nothing to press");
    const empty = render({ participants: [], onParticipantPress: noop });
    assert.equal(buttons(empty).length, 0);
    assert.ok(findAll(empty, (node) => (node.children ?? []).includes("emptyNoParticipants")).length > 0);

    const loading = render({ isLoading: true, onParticipantPress: noop });
    assert.equal(buttons(loading).length, 0);
    assert.equal(findAll(loading, (node) => node.type === "ActivityIndicator").length, 1);
  });
});
