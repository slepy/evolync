import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PASSWORD_RULES, passwordRegex, passwordRuleStates } from "@/modules/auth/utils/passwordRules";

const metKeys = (password: string) =>
  passwordRuleStates(password)
    .filter((r) => r.met)
    .map((r) => r.key);

describe("passwordRuleStates", () => {
  it("lists the rules in chip order", () => {
    assert.deepEqual(PASSWORD_RULES, ["length", "upper", "lower", "digit", "symbol"]);
    assert.deepEqual(
      passwordRuleStates("").map((r) => r.key),
      PASSWORD_RULES,
    );
  });

  it("meets nothing for an empty password", () => {
    assert.deepEqual(metKeys(""), []);
  });

  it("reports every rule separately", () => {
    // Board "New organization": Smok2026 lacks only the symbol.
    assert.deepEqual(metKeys("Smok2026"), ["length", "upper", "lower", "digit"]);
    assert.deepEqual(metKeys("abc"), ["lower"]);
    assert.deepEqual(metKeys("ABC!"), ["upper", "symbol"]);
    assert.deepEqual(metKeys("1234567"), ["digit"]);
  });

  it("meets all rules exactly when the regex accepts a password of allowed characters", () => {
    for (const password of ["Kata!2026x", "Nowe!haslo7", "Aa1@aaaa", "Smok2026", "kata!2026x", "Aa1@aaa", "AAAA1111!"]) {
      const allMet = passwordRuleStates(password).every((r) => r.met);
      assert.equal(allMet, passwordRegex.test(password), password);
    }
  });

  it("leaves characters outside the allowed set to the regex", () => {
    // All chips green, but '#' is not an allowed symbol: the schema still rejects it.
    assert.ok(passwordRuleStates("Kata!2026#").every((r) => r.met));
    assert.equal(passwordRegex.test("Kata!2026#"), false);
  });
});
