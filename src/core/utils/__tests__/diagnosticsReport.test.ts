import assert from "node:assert/strict";
import { test } from "node:test";
import { formatReport } from "../diagnosticsReport";

const ctx = { device: "android 37", time: "2026-11-04T10:00:00.000Z" };

test("an Error keeps its name, message and a short stack", () => {
  const error = new TypeError("Cannot read property 'id' of undefined");
  error.stack = ["TypeError: x", ...Array.from({ length: 30 }, (_, i) => `at f${i}`)].join("\n");
  const lines = formatReport(error, ctx).split("\n");
  assert.equal(lines[0], "2026-11-04T10:00:00.000Z · android 37");
  assert.equal(lines[1], "TypeError: Cannot read property 'id' of undefined");
  assert.equal(lines[2], "at f0");
  assert.equal(lines.length, 2 + 15);
});

test("a sync error string is the message", () => {
  assert.equal(
    formatReport("Sync push failed: boom", ctx),
    "2026-11-04T10:00:00.000Z · android 37\nSync push failed: boom",
  );
});

test("other thrown values are serialized", () => {
  assert.match(formatReport({ code: 42 }, ctx), /\{"code":42\}$/);
  assert.match(formatReport(undefined, ctx), /undefined$/);
});
