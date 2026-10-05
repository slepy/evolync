import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { activeNavKey, hasAlertDot, resolveNavHome } from "@/core/components/BottomNav/navItems";

describe("activeNavKey", () => {
  it("maps both dashboards to home", () => {
    assert.equal(activeNavKey("/organization/dashboard"), "home");
    assert.equal(activeNavKey("/user/dashboard/"), "home");
  });

  it("maps a school dashboard to home, but not the school's sub-screens", () => {
    assert.equal(activeNavKey("/school/abc-123/dashboard"), "home");
    assert.equal(activeNavKey("/school/abc-123/dashboard/"), "home");
    assert.equal(activeNavKey("/school/abc-123/orders"), null);
  });

  it("maps the tab screens and their sub-screens", () => {
    assert.equal(activeNavKey("/techniques"), "notebook");
    assert.equal(activeNavKey("/techniques/notes"), "notebook");
    assert.equal(activeNavKey("/notifications"), "alerts");
    assert.equal(activeNavKey("/user/profile"), "profile");
    assert.equal(activeNavKey("/user/settings"), "settings");
  });

  it("returns null outside the nav", () => {
    assert.equal(activeNavKey("/organization/events"), null);
    assert.equal(activeNavKey("/techniquesX"), null);
    assert.equal(activeNavKey("/user/payments"), null);
  });
});

describe("resolveNavHome", () => {
  it("prefers the dashboard last shown", () => {
    assert.equal(resolveNavHome("student", true), "student");
    assert.equal(resolveNavHome("organization", false), "organization");
  });

  it("falls back to the organization for an owner, the member dashboard otherwise", () => {
    assert.equal(resolveNavHome(null, true), "organization");
    assert.equal(resolveNavHome(null, false), "student");
  });
});

describe("hasAlertDot", () => {
  it("shows the dot only with unread notifications", () => {
    assert.equal(hasAlertDot(0), false);
    assert.equal(hasAlertDot(3), true);
  });
});
