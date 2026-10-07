import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildContextOptions, orgOptionId } from "@/core/components/ContextSwitcher/contextOptions";

const schools = [
  { id: "s1", name: "Warszawa Mokotów", address: "ul. Puławska 1", organizationId: "org-1" },
  { id: "s2", name: "Kraków", organizationId: "org-1" },
  { id: "s3", name: "Tiger Claw Kung Fu", address: "Poznań", organizationId: "org-2" },
];

describe("buildContextOptions", () => {
  it("lists the own organization first, then every school trained in", () => {
    const options = buildContextOptions({
      organization: { id: "org-1", name: "Dragon Gate Academy" },
      memberships: [
        { memberId: "m3", schoolId: "s3" },
        { memberId: "m2", schoolId: "s2" },
      ],
      schools,
    });

    assert.deepEqual(
      options.map((o) => [o.id, o.context, o.title]),
      [
        [orgOptionId("org-1"), "organization", "Dragon Gate Academy"],
        ["m3", "student", "Tiger Claw Kung Fu"],
        ["m2", "student", "Kraków"],
      ],
    );
  });

  it("subtitles a school with its address, or just Student without one", () => {
    const [withAddress, withoutAddress] = buildContextOptions({
      organization: null,
      memberships: [
        { memberId: "m3", schoolId: "s3" },
        { memberId: "m2", schoolId: "s2" },
      ],
      schools,
    });

    assert.equal(withAddress.subtitle, "contextStudentAt");
    assert.equal(withoutAddress.subtitle, "contextStudent");
  });

  it("has no Manage row without an organization", () => {
    const options = buildContextOptions({ organization: null, memberships: [], schools });
    assert.deepEqual(options, []);
  });

  it("shows a placeholder until a foreign school is fetched", () => {
    const [option] = buildContextOptions({
      organization: null,
      memberships: [{ memberId: "m9", schoolId: "missing" }],
      schools,
    });
    assert.equal(option.title, "…");
    assert.equal(option.subtitle, "contextStudent");
  });
});
