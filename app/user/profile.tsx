import {
  ProfileScreen,
  isLocalPhoto,
  profileValuesFromUser,
  toProfileMetadata,
  type ProfileValues,
} from "@/modules/auth";
import { signOut } from "@/core/utils/signOutBridge";
import { uploadImage } from "@/core/utils/uploadImage";
import { sync } from "@/database/sync";
import { useStore } from "@/store";
import React from "react";

// Import supabase using require to avoid Metro bundler issues
const { supabase } = require("@/config/supabase");

const AVATAR_BUCKET = "avatars";

/** Profile tab (P1 / P2), every role: own photo, name and phone; sign-in email read-only. */
export default function ProfileRoute() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);

  const handleSubmit = async (values: ProfileValues): Promise<ProfileValues> => {
    let avatarUrl = values.avatarUrl;
    if (isLocalPhoto(avatarUrl)) {
      try {
        avatarUrl = await uploadImage(avatarUrl, AVATAR_BUCKET, user?.id);
      } catch (uploadErr) {
        console.error("[ProfileRoute] Avatar upload error:", uploadErr);
        throw new Error(t("profileAvatarUploadError"));
      }
    }

    const { data, error } = await supabase.auth.updateUser({
      data: toProfileMetadata(values, avatarUrl),
    });
    if (error) throw error;
    if (data?.user) setUser(data.user);

    sync().catch(console.error);
    return { ...values, avatarUrl };
  };

  return (
    <ProfileScreen
      key={user?.id}
      initial={profileValuesFromUser(user)}
      email={user?.email ?? ""}
      onSubmit={handleSubmit}
      onSignOut={() => signOut().catch(console.error)}
    />
  );
}
