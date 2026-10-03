import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../../../..");
const read = (file: string) => readFileSync(path.join(ROOT, file), "utf8");

describe("student trainings screen", () => {
  const screen = read("app/user/trainings.tsx");

  it("is read-only: no press handler, no mutation imports", () => {
    assert.ok(!/onPressTraining/.test(screen));
    assert.ok(!/(create|update|delete|extend|set)[A-Z]\w*Training/.test(screen));
    assert.ok(!/SubmitComponent|OptionsSheet/.test(screen));
  });

  it("is reachable from the student dashboard", () => {
    assert.ok(read("app/user/dashboard.tsx").includes('"/user/trainings"'));
  });

  it("cancelled trainings are labeled on the shared card", () => {
    const card = read("src/modules/trainings/components/TrainingCard.tsx");
    assert.ok(/isCancelled \?[\s\S]*statusCancelled/.test(card));
  });
});
