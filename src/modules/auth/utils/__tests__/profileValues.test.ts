import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isLocalPhoto, profileValuesFromUser, toProfileMetadata } from "@/modules/auth/utils/profileValues";

describe("profileValuesFromUser", () => {
  it("reads name, photo and phone from the auth metadata", () => {
    const values = profileValuesFromUser({
      user_metadata: { full_name: "Anna Nowak", avatar_url: "https://x/a.jpg", phone_number: "+48601234567" },
    });
    assert.deepEqual(values, {
      fullName: "Anna Nowak",
      avatarUrl: "https://x/a.jpg",
      phone: { prefix: "+48", number: "601234567" },
    });
  });

  it("starts empty with the default prefix when nothing is saved", () => {
    assert.deepEqual(profileValuesFromUser(null), {
      fullName: "",
      avatarUrl: null,
      phone: { prefix: "+48", number: "" },
    });
  });

  it("treats an empty photo URL as no photo", () => {
    assert.equal(profileValuesFromUser({ user_metadata: { avatar_url: "" } }).avatarUrl, null);
  });
});

describe("isLocalPhoto", () => {
  it("is true for a picked file and false for an uploaded URL or none", () => {
    assert.equal(isLocalPhoto("file:///tmp/photo.jpg"), true);
    assert.equal(isLocalPhoto("https://cdn/photo.jpg"), false);
    assert.equal(isLocalPhoto(null), false);
  });
});

describe("toProfileMetadata", () => {
  it("trims the name and joins the phone", () => {
    assert.deepEqual(
      toProfileMetadata(
        { fullName: "  Anna Nowak-Lis ", avatarUrl: "file:///p.jpg", phone: { prefix: "+44", number: "7700900" } },
        "https://cdn/p.jpg",
      ),
      { full_name: "Anna Nowak-Lis", avatar_url: "https://cdn/p.jpg", phone_number: "+447700900" },
    );
  });

  it("saves no phone when the number is empty and no photo when it was removed", () => {
    assert.deepEqual(
      toProfileMetadata({ fullName: "Anna", avatarUrl: null, phone: { prefix: "+48", number: "" } }, null),
      { full_name: "Anna", avatar_url: null, phone_number: null },
    );
  });
});
