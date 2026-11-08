import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import TestRenderer, { type ReactTestRenderer, type ReactTestRendererJSON } from "react-test-renderer";

/**
 * Alerts inbox (#82): a notification is deleted like a row of any other list —
 * a trash button next to the row, behind a confirmation — not by swiping it.
 * The trash button sits outside the row's pressable area, so a tap on it never
 * opens the notification, and the screen-reader "delete" action asks first too.
 */

const host =
  (name: string) =>
  ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement(name, props, children);

const stub = (request: string, exports: unknown) => {
  const resolved = require.resolve(request);
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports,
  } as any;
};

const confirms: { title: string; message: string; onConfirm: () => void }[] = [];
const deleted: string[] = [];
const notification = {
  id: "n1",
  type: "payment",
  readAt: null,
  createdAt: new Date(),
};

const TabPage = ({ children, actions }: { children?: React.ReactNode; actions?: React.ReactNode }) =>
  React.createElement("TabPage", null, actions, children);
const Section = ({ children }: { children?: React.ReactNode }) => React.createElement("Section", null, children);

stub("tamagui", {
  Text: host("Text"),
  XStack: host("XStack"),
  YStack: host("YStack"),
});
stub("lucide-react-native", {
  BellOff: host("BellOff"),
  CheckCheck: host("CheckCheck"),
});
stub("@/core/components", {
  EmptyState: host("EmptyState"),
  IconButton: host("IconButton"),
  ListCard: Section,
  ListSection: Section,
  ListIcon: host("ListIcon"),
  ListUnreadDot: host("ListUnreadDot"),
  MainNav: host("MainNav"),
  Notice: host("Notice"),
  TabPage,
  TrashButton: host("TrashButton"),
  useNavHome: () => "organization",
});
stub("@/core/utils/confirmDelete", {
  confirmDelete: (title: string, message: string, onConfirm: () => void) =>
    confirms.push({ title, message, onConfirm }),
});
stub("@/store", {
  useStore: (select: (s: unknown) => unknown) => select({ user: { id: "u1" } }),
});
stub(require.resolve("../hooks"), {
  useNotifications: () => [notification],
  useOpenNotification: () => () => true,
});
stub(require.resolve("../services"), {
  deleteAllNotifications: async () => {},
  deleteNotification: async (id: string) => {
    deleted.push(id);
  },
  markAllNotificationsRead: async () => {},
  markNotificationRead: async () => {},
  resolveNotificationOpen: async () => ({ status: "none" }),
});
stub(require.resolve("../utils"), {
  getNotificationContent: () => ({
    title: "Payment due",
    body: "Pay for November",
  }),
  groupInbox: (items: unknown[]) => [{ key: "today", unread: items.length, items }],
  inboxDateLocale: () => "en",
  inboxTimeLabel: () => "12 min",
});
stub(require.resolve("../utils/rowStyle"), {
  notificationRowStyle: () => ({ icon: host("Icon"), accent: "payments" }),
});

(globalThis as any).t = (key: string) => key;
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const { NotificationRow } = require("../components/NotificationRow") as typeof import("../components/NotificationRow");
const { NotificationsScreen } =
  require("../components/NotificationsScreen") as typeof import("../components/NotificationsScreen");

type Node = ReactTestRendererJSON;

const findAll = (renderer: ReactTestRenderer, match: (node: Node) => boolean): Node[] => {
  const walk = (node: Node | Node[] | string | null): Node[] => {
    if (node === null || typeof node === "string") return [];
    if (Array.isArray(node)) return node.flatMap(walk);
    return (match(node) ? [node] : []).concat((node.children ?? []).flatMap(walk));
  };
  return walk(renderer.toJSON());
};

const contains = (parent: Node, child: Node): boolean =>
  parent === child || (parent.children ?? []).some((c) => typeof c !== "string" && contains(c, child));

function render(element: React.ReactElement) {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(element);
  });
  return renderer;
}

const rowProps = {
  title: "Payment due",
  body: "Pay",
  time: "12 min",
  unread: true,
  icon: host("Icon") as any,
  accent: "payments" as const,
};

describe("NotificationRow delete", () => {
  it("shows a trash button outside the pressable row when onDelete is set", () => {
    let presses = 0;
    let deletes = 0;
    const renderer = render(
      React.createElement(NotificationRow, {
        ...rowProps,
        onPress: () => presses++,
        onDelete: () => deletes++,
      }),
    );
    const [row] = findAll(renderer, (node) => node.props.role === "button");
    const [trash] = findAll(renderer, (node) => node.type === "TrashButton");

    assert.ok(trash, "trash button rendered");
    assert.equal(contains(row, trash), false, "trash button is not inside the pressable row");

    act(() => trash.props.onPress());
    assert.equal(deletes, 1);
    assert.equal(presses, 0);

    act(() =>
      row.props.onAccessibilityAction({
        nativeEvent: { actionName: "delete" },
      }),
    );
    assert.equal(deletes, 2);

    act(() => row.props.onPress());
    assert.equal(presses, 1);
  });

  it("has no trash button without onDelete", () => {
    const renderer = render(React.createElement(NotificationRow, { ...rowProps, onPress: () => {} }));
    assert.equal(findAll(renderer, (node) => node.type === "TrashButton").length, 0);
  });
});

describe("NotificationsScreen delete", () => {
  it("asks for confirmation before deleting one notification", async () => {
    const renderer = render(React.createElement(NotificationsScreen));
    try {
      const trash = findAll(renderer, (node) => node.type === "TrashButton" && node.props.size === 40);
      assert.equal(trash.length, 1, "one trash button per notification row");

      act(() => trash[0].props.onPress());
      assert.equal(deleted.length, 0, "nothing deleted before confirming");
      assert.equal(confirms.length, 1);
      assert.equal(confirms[0].title, "delete");
      assert.equal(confirms[0].message, "notificationsDeleteConfirm");

      confirms[0].onConfirm();
      await Promise.resolve();
      assert.deepEqual(deleted, ["n1"]);
    } finally {
      // Clears the screen's one-minute clock so the test process can exit.
      act(() => renderer.unmount());
    }
  });
});
