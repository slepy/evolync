import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveStatusColor } from "@/core/components/StatusBadge/statusColor";
import { moduleAccents, neutral } from "@/core/theme/tokens";

describe("resolveStatusColor", () => {
  it("uses the tint and fill of an accent key", () => {
    assert.deepEqual(resolveStatusColor("payments"), {
      tint: moduleAccents.payments.tint,
      fill: moduleAccents.payments.fill,
    });
    assert.deepEqual(resolveStatusColor("neutral"), { tint: neutral.tint, fill: neutral.tintFill });
  });

  it("passes explicit colors through", () => {
    const color = { tint: neutral.placeholder, fill: "rgba(148,163,184,0.10)" };
    assert.equal(resolveStatusColor(color), color);
  });
});
