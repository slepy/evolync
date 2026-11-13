import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  archivedStudents,
  inviteExpiry,
  latestInvite,
  requestAge,
  restoredStatus,
  studentStatusPill,
  visibleStudents,
} from "../studentList";

const student = (displayName: string, status: "active" | "archived" | "pending", userId: string | null, email = "") => ({
  displayName,
  email,
  status,
  userId,
});

describe("archivedStudents", () => {
  const list = [
    student("Tomasz Wójcik", "archived", "u3", "t.wojcik@gmail.com"),
    student("Anna Kowalska", "active", "u2", "anna@gmail.com"),
    student("Marek Nowicki", "archived", null, "marek@wp.pl"),
  ];

  it("keeps only archived students, by name", () => {
    assert.deepEqual(
      archivedStudents(list, "").map((s) => s.displayName),
      ["Marek Nowicki", "Tomasz Wójcik"],
    );
  });

  it("matches the name without diacritics, or the email", () => {
    assert.deepEqual(archivedStudents(list, "wojcik").map((s) => s.displayName), ["Tomasz Wójcik"]);
    assert.deepEqual(archivedStudents(list, "wp.pl").map((s) => s.displayName), ["Marek Nowicki"]);
    assert.deepEqual(archivedStudents(list, "anna"), []);
  });
});

describe("restoredStatus", () => {
  it("is active for a student with an app account", () => {
    assert.equal(restoredStatus("u1"), "active");
  });

  it("is offline for a student without an account", () => {
    assert.equal(restoredStatus(null), "offline");
    assert.equal(restoredStatus(undefined), "offline");
  });
});

describe("visibleStudents", () => {
  const list = [
    student("Jan Zieliński", "active", null, "jan@x.pl"),
    student("Zofia Wiśniewska", "active", "u1", "zofia@x.pl"),
    student("Anna Kowalska", "active", "u2", "anna@gmail.com"),
  ];

  it("puts members with an account first, by name", () => {
    assert.deepEqual(
      visibleStudents(list, "").map((s) => s.displayName),
      ["Anna Kowalska", "Zofia Wiśniewska", "Jan Zieliński"],
    );
  });

  it("matches the name without diacritics, or the email", () => {
    assert.deepEqual(visibleStudents(list, "zielinski").map((s) => s.displayName), ["Jan Zieliński"]);
    assert.deepEqual(visibleStudents(list, "gmail").map((s) => s.displayName), ["Anna Kowalska"]);
  });
});

describe("studentStatusPill", () => {
  it("shows nothing for an active member and No account without a user", () => {
    assert.equal(studentStatusPill("active", "u1"), null);
    assert.deepEqual(studentStatusPill("active", null), { label: "statusNoAccount", tone: "neutral" });
    assert.deepEqual(studentStatusPill("pending", "u1"), { label: "statusPending", tone: "warning" });
  });
});

describe("requestAge", () => {
  const now = new Date(2026, 9, 6, 15, 0);

  it("counts minutes and hours today", () => {
    assert.deepEqual(requestAge(new Date(2026, 9, 6, 14, 59, 30), now), { kind: "justNow" });
    assert.deepEqual(requestAge(new Date(2026, 9, 6, 14, 20), now), { kind: "minutes", count: 40 });
    assert.deepEqual(requestAge(new Date(2026, 9, 6, 13, 0), now), { kind: "hours", count: 2 });
  });

  it("says Yesterday for the day before, then the date", () => {
    assert.deepEqual(requestAge(new Date(2026, 9, 5, 23, 30), now), { kind: "yesterday" });
    assert.deepEqual(requestAge(new Date(2026, 9, 5, 0, 10), now), { kind: "yesterday" });
    assert.deepEqual(requestAge(new Date(2026, 9, 3, 12, 0), now), { kind: "date" });
  });
});

describe("invites", () => {
  it("expires the given number of days later", () => {
    const now = new Date(2026, 9, 4, 12, 0);
    assert.equal(inviteExpiry(now, 7).getTime() - now.getTime(), 7 * 86_400_000);
  });

  it("shows the code that stays valid the longest", () => {
    const invites = [
      { code: "A", expiresAt: new Date(2026, 9, 10) },
      { code: "B", expiresAt: new Date(2026, 9, 18) },
    ];
    assert.equal(latestInvite(invites)?.code, "B");
    assert.equal(latestInvite([]), undefined);
  });
});
