import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import TestRenderer, { type ReactTestRenderer, type ReactTestRendererJSON } from "react-test-renderer";

/**
 * Issue #81: on Android the keyboard covered the field being typed in (variant
 * Stock, the last Profile field, Add product). The pages turned
 * `KeyboardAvoidingView` off on Android, and edge-to-edge means the window is
 * never resized, so nothing moved the content. Every form page must scroll the
 * focused input above the keyboard on Android too, with the pinned footer
 * riding on the keyboard, and a tall (`fill`) sheet must keep its content and
 * footer above it.
 */

const host =
  (name: string) =>
  ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement(name, props, children);

const stub = (request: string, exports: unknown) => {
  const resolved = require.resolve(request);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports } as any;
};

const INSET_BOTTOM = 24;
const keyboard = { isVisible: false, height: 0 };

const Sheet = Object.assign(host("Sheet"), {
  Overlay: host("SheetOverlay"),
  Frame: host("SheetFrame"),
  Handle: host("SheetHandle"),
});

stub("react-native", {
  Platform: { OS: "android", select: (o: Record<string, unknown>) => o.android ?? o.default },
  KeyboardAvoidingView: host("KeyboardAvoidingView"),
});
stub("react-native-safe-area-context", {
  SafeAreaView: host("SafeAreaView"),
  useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: INSET_BOTTOM }),
});
stub("tamagui", {
  ScrollView: host("ScrollView"),
  YStack: host("YStack"),
  XStack: host("XStack"),
  Text: host("Text"),
  View: host("View"),
  Sheet,
});
stub("expo-linear-gradient", { LinearGradient: host("LinearGradient") });
stub("lucide-react-native", { X: host("X") });
stub("react-native-keyboard-controller", {
  KeyboardAwareScrollView: host("KeyboardAwareScrollView"),
  KeyboardStickyView: host("KeyboardStickyView"),
  KeyboardAvoidingView: host("KeyboardControllerAvoidingView"),
  useKeyboardState: <T>(selector?: (s: typeof keyboard) => T) => (selector ? selector(keyboard) : keyboard),
});
stub("@/core/components/SubScreen/SubScreenHeader", { SubScreenHeader: host("SubScreenHeader") });
stub("@/core/components/BottomNav/BottomNav", { useBottomNavSpace: () => 120 });
stub("@/core/components/SyncedPill/SyncedPill", { SyncedPill: host("SyncedPill") });

const { SubScreenPage } = require("@/core/components/SubScreen/SubScreenPage") as typeof import("@/core/components/SubScreen/SubScreenPage");
const { TabPage } = require("@/core/components/TabPage/TabPage") as typeof import("@/core/components/TabPage/TabPage");
const { AuthPage } = require("@/core/components/AuthPage/AuthPage") as typeof import("@/core/components/AuthPage/AuthPage");
const { FormSheet } = require("@/core/components/FormSheet/FormSheet") as typeof import("@/core/components/FormSheet/FormSheet");

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

type Node = ReactTestRendererJSON;

const find = (node: Node | Node[] | null, type: string): Node[] => {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap((n) => find(n, type));
  const own = node.type === type ? [node] : [];
  return own.concat((node.children ?? []).flatMap((c) => (typeof c === "string" ? [] : find(c, type))));
};

const contains = (node: Node, type: string) => find(node, type).length > 0;

function render(element: React.ReactElement) {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(element);
  });
  return renderer;
}

const field = React.createElement("Field");
const footer = React.createElement("Footer");

/** The content scrolls in a keyboard-aware scroll view; no keyboard handling is switched off on Android. */
function assertKeyboardAwareContent(tree: Node | Node[] | null) {
  for (const avoiding of find(tree, "KeyboardAvoidingView")) {
    assert.notEqual(avoiding.props.behavior, undefined, "KeyboardAvoidingView does nothing on Android without a behavior");
  }
  const scrolls = find(tree, "KeyboardAwareScrollView");
  assert.equal(scrolls.length, 1, "the page content scrolls in a KeyboardAwareScrollView");
  assert.ok(contains(scrolls[0], "Field"), "the form fields are inside the keyboard-aware scroll view");
  return scrolls[0];
}

/** The footer rides on the keyboard and the focused input is kept above it. */
function assertStickyFooter(renderer: ReactTestRenderer) {
  const sticky = find(renderer.toJSON(), "KeyboardStickyView");
  assert.equal(sticky.length, 1, "the pinned footer is a KeyboardStickyView");
  assert.ok(contains(sticky[0], "Footer"));
  assert.notEqual(sticky[0].props.enabled, false);
  // The footer sits on the bottom safe area; over the keyboard that gap would float it.
  assert.equal(sticky[0].props.offset?.opened, INSET_BOTTOM);

  act(() => {
    sticky[0].props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 76 } } });
  });
  const scroll = find(renderer.toJSON(), "KeyboardAwareScrollView")[0];
  assert.ok(scroll.props.bottomOffset >= 76, `the focused input stays above the footer (bottomOffset ${scroll.props.bottomOffset})`);
}

describe("form pages keep the focused input above the keyboard on Android (#81)", () => {
  it("SubScreenPage form (variant Stock) scrolls the input up and keeps Save on the keyboard", () => {
    const renderer = render(React.createElement(SubScreenPage, { title: "Product", footer, children: field }));
    assertKeyboardAwareContent(renderer.toJSON());
    assertStickyFooter(renderer);
  });

  it("SubScreenPage without a footer is keyboard-aware too", () => {
    const renderer = render(React.createElement(SubScreenPage, { title: "List", children: field }));
    const scroll = assertKeyboardAwareContent(renderer.toJSON());
    assert.ok(scroll.props.bottomOffset > 0);
    assert.equal(find(renderer.toJSON(), "KeyboardStickyView").length, 0);
  });

  it("TabPage with a footer (Profile) scrolls the last field up and keeps Save on the keyboard", () => {
    const renderer = render(React.createElement(TabPage, { title: "Profile", footer, children: field }));
    assertKeyboardAwareContent(renderer.toJSON());
    assertStickyFooter(renderer);
  });

  it("TabPage with the nav is keyboard-aware", () => {
    const renderer = render(React.createElement(TabPage, { title: "Settings", nav: React.createElement("Nav"), children: field }));
    assertKeyboardAwareContent(renderer.toJSON());
  });

  it("AuthPage (sign up) scrolls the input up and keeps the button on the keyboard", () => {
    const renderer = render(React.createElement(AuthPage, { title: "Sign up", footer, children: field }));
    assertKeyboardAwareContent(renderer.toJSON());
    assertStickyFooter(renderer);
  });
});

describe("FormSheet fill (Add product) keeps its content and footer above the keyboard (#81)", () => {
  beforeEach(() => {
    keyboard.isVisible = false;
    keyboard.height = 0;
  });

  const sheet = (fill: boolean) =>
    React.createElement(FormSheet, { open: true, onOpenChange: () => {}, title: "Add product", fill, footer, children: field });

  it("a fill sheet makes room for the open keyboard instead of sliding under it", () => {
    keyboard.isVisible = true;
    keyboard.height = 300;
    const tree = render(sheet(true)).toJSON();
    assert.ok(!find(tree, "Sheet")[0].props.moveOnKeyboardChange, "a 92% sheet cannot move up by the keyboard height");
    const frame = find(tree, "SheetFrame")[0];
    assert.ok(frame.props.paddingBottom >= 300, `footer above the keyboard (paddingBottom ${frame.props.paddingBottom})`);
  });

  it("a fill sheet keeps its designed bottom padding while the keyboard is closed", () => {
    const frame = find(render(sheet(true)).toJSON(), "SheetFrame")[0];
    assert.equal(frame.props.paddingBottom, 40);
  });

  it("a small sheet still moves up with the keyboard", () => {
    const tree = render(sheet(false)).toJSON();
    assert.equal(find(tree, "Sheet")[0].props.moveOnKeyboardChange, true);
  });
});
