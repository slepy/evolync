import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type Training from "@/database/models/Training";
import { countActiveWithinDays, groupTrainingsByDay } from "../components/groupByDay";

const training = (id: string, day: string, status = "active") =>
  ({ id, date: new Date(`${day}T00:00:00Z`), status }) as unknown as Training;

describe("groupTrainingsByDay", () => {
  it("groups consecutive trainings of the same day in order", () => {
    const sections = groupTrainingsByDay([
      training("a", "2099-01-03"),
      training("b", "2099-01-03"),
      training("c", "2099-01-05"),
    ]);
    assert.deepEqual(
      sections.map((s) => [s.day, s.data.map((t) => t.id)]),
      [["2099-01-03", ["a", "b"]], ["2099-01-05", ["c"]]],
    );
    assert.deepEqual(groupTrainingsByDay([]), []);
  });
});

describe("countActiveWithinDays", () => {
  it("counts active trainings in the next N days from today, excluding cancelled", () => {
    const list = [
      training("today", "2099-01-01"),
      training("day7", "2099-01-07"),
      training("day8", "2099-01-08"),
      training("cancelled", "2099-01-02", "cancelled"),
      training("past", "2098-12-31"),
    ];
    assert.equal(countActiveWithinDays(list, "2099-01-01", 7), 2);
  });
});
