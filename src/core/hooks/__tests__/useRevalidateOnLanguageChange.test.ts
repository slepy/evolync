import { before, describe, it } from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import TestRenderer, { type ReactTestRenderer } from "react-test-renderer";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { useRevalidateOnLanguageChange } from "../useRevalidateOnLanguageChange";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe("useRevalidateOnLanguageChange", () => {
  before(async () => {
    await i18n.use(initReactI18next).init({
      resources: { en: { translation: {} }, pl: { translation: {} } },
      lng: "en",
      react: { useSuspense: false },
    });
  });

  it("re-validates only the fields showing an error, only after a language change", async () => {
    const calls: unknown[] = [];
    const trigger = (names: unknown) => calls.push(names);
    let errors: object = { confirmPassword: { message: "Passwords don’t match" }, root: { message: "x" } };

    const Probe = () => {
      useRevalidateOnLanguageChange(errors, trigger);
      return null;
    };

    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Probe));
    });
    assert.deepEqual(calls, [], "no re-validation on mount");

    await act(async () => {
      await i18n.changeLanguage("pl");
    });
    assert.deepEqual(calls, [["confirmPassword"]]);

    errors = {};
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    assert.deepEqual(calls, [["confirmPassword"]], "nothing to re-validate without errors");

    await act(async () => renderer.unmount());
  });
});
