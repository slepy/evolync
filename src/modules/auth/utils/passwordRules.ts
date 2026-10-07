/**
 * Password rules shared by sign up and password reset. `passwordRegex` is the
 * one source the Zod schemas validate with; `passwordRuleStates` splits it into
 * the rule chips shown under a password field.
 */

export const PASSWORD_SYMBOLS = "@$!%*?&";

/** At least 8 characters, one uppercase, one lowercase, one digit, one symbol from PASSWORD_SYMBOLS; nothing else. */
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export type PasswordRuleKey = "length" | "upper" | "lower" | "digit" | "symbol";

const RULE_TESTS: Record<PasswordRuleKey, (password: string) => boolean> = {
  length: (p) => p.length >= 8,
  upper: (p) => /[A-Z]/.test(p),
  lower: (p) => /[a-z]/.test(p),
  digit: (p) => /\d/.test(p),
  symbol: (p) => /[@$!%*?&]/.test(p),
};

export const PASSWORD_RULES = Object.keys(RULE_TESTS) as PasswordRuleKey[];

export interface PasswordRuleState {
  key: PasswordRuleKey;
  met: boolean;
}

/** Each rule in display order (8+ characters, A–Z, a–z, 0–9, symbol) with whether `password` meets it. */
export function passwordRuleStates(password: string): PasswordRuleState[] {
  return PASSWORD_RULES.map((key) => ({ key, met: RULE_TESTS[key](password) }));
}
