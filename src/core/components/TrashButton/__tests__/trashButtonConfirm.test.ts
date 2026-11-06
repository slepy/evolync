import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../../../../..");

const sources = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === "__tests__" ? [] : sources(full);
    return name.endsWith(".tsx") ? [full] : [];
  });

/**
 * Files rendering a `TrashButton` whose callback is confirmed elsewhere: the
 * file (or `sheet:` marker) that asks before anything is removed.
 */
const CONFIRMED_ELSEWHERE: Record<string, string> = {
  // Opens the delete sheet (title, message, Delete / Cancel).
  "src/modules/events/components/EventDetailsScreen.tsx": "sheet",
  // Opens the scoped delete sheet (this / following trainings).
  "src/modules/trainings/components/TrainingDetailsScreen.tsx": "sheet",
  "src/modules/inventory/components/ProductFormScreen.tsx": "app/organization/inventory/[productId]/edit.tsx",
  "src/modules/inventory/components/VariantFields.tsx": "src/modules/inventory/components/ProductFormScreen.tsx",
  "src/modules/techniques/notes/components/NoteRowCard.tsx": "src/modules/techniques/notes/components/NoteForm.tsx",
  "src/modules/notifications/components/NotificationRow.tsx":
    "src/modules/notifications/components/NotificationsScreen.tsx",
};

const read = (file: string) => readFileSync(path.join(ROOT, file), "utf8");

describe("trash buttons ask before deleting", () => {
  const users = [...sources(path.join(ROOT, "src")), ...sources(path.join(ROOT, "app"))]
    .map((file) => path.relative(ROOT, file))
    .filter((file) => /<TrashButton\b/.test(read(file)) && !file.includes("components/TrashButton/"));

  it("finds the trash buttons of the app", () => {
    assert.ok(users.length >= 15, `expected the app's trash buttons, found ${users.length}`);
  });

  for (const file of users) {
    it(`${file} confirms with confirmDelete`, () => {
      const confirming = CONFIRMED_ELSEWHERE[file];
      if (confirming === "sheet") return;
      const target = confirming ?? file;
      assert.match(
        read(target),
        /\bconfirmDelete\(/,
        confirming
          ? `${file} delegates the delete to ${target}, which must call confirmDelete`
          : `${file} renders a TrashButton without confirmDelete`,
      );
    });
  }
});
