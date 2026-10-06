import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { rateAccent, ratePercent } from "@/core/components/List/rateAccent";
import { resolveListAccent } from "@/core/components/List/accent";
import { success, warning } from "@/core/theme/tokens";

describe("rateAccent", () => {
  it("is green from 80%", () => {
    assert.equal(rateAccent(8, 10), "success");
    assert.equal(rateAccent(10, 10), "success");
    assert.equal(rateAccent(7, 8), "success");
  });

  it("is amber from 50% to 79%", () => {
    assert.equal(rateAccent(5, 10), "warning");
    assert.equal(rateAccent(7, 10), "warning");
  });

  it("is red below 50%", () => {
    assert.equal(rateAccent(4, 9), "danger");
    assert.equal(rateAccent(0, 3), "danger");
  });

  it("stays neutral with nothing to count", () => {
    assert.equal(rateAccent(0, 0), "neutral");
  });
});

describe("ratePercent", () => {
  it("rounds to a whole percent", () => {
    assert.equal(ratePercent(4, 9), 44);
    assert.equal(ratePercent(7, 10), 70);
    assert.equal(ratePercent(0, 0), 0);
  });
});

describe("status accents", () => {
  it("resolve success and warning to the status tokens", () => {
    assert.equal(resolveListAccent("success").tint, success.text);
    assert.equal(resolveListAccent("success").fill, success.fill);
    assert.equal(resolveListAccent("warning").tint, warning.text);
    assert.equal(resolveListAccent("warning").fill, warning.fill);
  });
});
