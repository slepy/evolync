import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  THEME_STORAGE_KEY,
  parseThemePreference,
  resolveTheme,
} from "@/core/theme/resolve";
import { createThemeStore, type ThemeStorage } from "@/core/theme/themeStore";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  const storage: ThemeStorage = {
    getItem: async (key) => data[key] ?? null,
    setItem: async (key, value) => {
      data[key] = value;
    },
  };
  return { data, storage };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe("parseThemePreference", () => {
  it("accepts the three valid preferences", () => {
    assert.equal(parseThemePreference("system"), "system");
    assert.equal(parseThemePreference("light"), "light");
    assert.equal(parseThemePreference("dark"), "dark");
  });

  it("falls back to system for missing or invalid values", () => {
    for (const raw of [null, undefined, "", "DARK", "blue", 1, {}]) {
      assert.equal(parseThemePreference(raw), "system");
    }
  });
});

describe("resolveTheme", () => {
  it("returns an explicit preference regardless of the OS", () => {
    assert.equal(resolveTheme("dark", "light"), "dark");
    assert.equal(resolveTheme("light", "dark"), "light");
  });

  it("follows the OS scheme for system", () => {
    assert.equal(resolveTheme("system", "dark"), "dark");
    assert.equal(resolveTheme("system", "light"), "light");
  });

  it("treats a null or unknown OS scheme as light", () => {
    assert.equal(resolveTheme("system", null), "light");
    assert.equal(resolveTheme("system", undefined), "light");
    assert.equal(resolveTheme("system", "unspecified"), "light");
  });
});

describe("theme store", () => {
  it("defaults to system", () => {
    const store = createThemeStore(memoryStorage().storage);
    assert.equal(store.getState().preference, "system");
  });

  it("loads a stored preference", async () => {
    const store = createThemeStore(memoryStorage({ [THEME_STORAGE_KEY]: "dark" }).storage);
    await store.getState().load();
    assert.equal(store.getState().preference, "dark");
  });

  it("falls back to system for a corrupt stored value", async () => {
    const store = createThemeStore(memoryStorage({ [THEME_STORAGE_KEY]: "purple" }).storage);
    await store.getState().load();
    assert.equal(store.getState().preference, "system");
  });

  it("falls back to system when storage read fails", async () => {
    const store = createThemeStore({
      getItem: async () => {
        throw new Error("storage unavailable");
      },
      setItem: async () => {},
    });
    store.setState({ preference: "dark" });
    const warn = console.warn;
    console.warn = () => {};
    try {
      await store.getState().load();
    } finally {
      console.warn = warn;
    }
    assert.equal(store.getState().preference, "system");
  });

  it("updates synchronously and persists the choice", async () => {
    const { data, storage } = memoryStorage();
    const store = createThemeStore(storage);
    store.getState().setPreference("light");
    assert.equal(store.getState().preference, "light");
    await flush();
    assert.equal(data[THEME_STORAGE_KEY], "light");
  });

  it("keeps the in-memory choice when persisting fails", async () => {
    const store = createThemeStore({
      getItem: async () => null,
      setItem: async () => {
        throw new Error("quota");
      },
    });
    const warn = console.warn;
    console.warn = () => {};
    try {
      store.getState().setPreference("dark");
      await flush();
    } finally {
      console.warn = warn;
    }
    assert.equal(store.getState().preference, "dark");
  });
});
