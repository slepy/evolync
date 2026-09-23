import {
  Header,
  HeaderTitle,
  SubmitComponent,
} from "@/modules/core/components";
import {
  ProfileForm,
  type ProfileFormHandle,
  type ProfileFormValues,
} from "@/modules/auth";
import { useDirtyFlag } from "@/modules/core/hooks";
import { uploadImage } from "@/modules/core/utils/uploadImage";
import {
  parsePhoneNumber,
  formatPhoneNumber,
} from "@/modules/core/utils/phoneHelpers";
import { sync } from "@/database/sync";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, YStack } from "tamagui";

// Import supabase using require to avoid Metro bundler issues
const { supabase } = require("@/config/supabase");

const AVATAR_BUCKET = "avatars";

export default function ProfileScreen() {
  const router = useRouter();
  const formRef = useRef<ProfileFormHandle>(null);
  const { user, setUser } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { isDirty, markDirty, reset: resetDirty } = useDirtyFlag();
  const insets = useSafeAreaInsets();

  const currentName = user?.user_metadata?.full_name ?? "";
  const currentAvatar = user?.user_metadata?.avatar_url ?? null;
  const currentPhone = parsePhoneNumber(user?.user_metadata?.phone_number);

  const handleSubmit = async (data: ProfileFormValues) => {
    try {
      setIsSubmitting(true);
      setFormError(null);

      let avatarUrl = data.avatar_url ?? null;

      if (avatarUrl && !avatarUrl.startsWith("http")) {
        try {
          avatarUrl = await uploadImage(avatarUrl, AVATAR_BUCKET, user?.id);
        } catch (uploadErr) {
          console.error("[ProfileScreen] Avatar upload error:", uploadErr);
          Alert.alert(t("error"), t("profileAvatarUploadError"));
          setIsSubmitting(false);
          return;
        }
      }

      const { data: updatedUser, error: updateError } =
        await supabase.auth.updateUser({
          data: {
            full_name: data.full_name.trim(),
            avatar_url: avatarUrl,
            phone_number: formatPhoneNumber(data.phone),
          },
        });

      if (updateError) {
        throw updateError;
      }

      if (updatedUser?.user) {
        setUser(updatedUser.user);
      }

      sync().catch(console.error);
      resetDirty();
      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("errorUpdateFailed");
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("profileTitle")} />}
        showLogoMenu={false}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <YStack flex={1}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              padding: 20,
              paddingBottom: 100,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <YStack maxWidth={500} width="100%" alignSelf="center" gap="$4">
              <ProfileForm
                ref={formRef}
                initialData={{
                  full_name: currentName,
                  avatar_url: currentAvatar,
                  email: user?.email,
                  phone: currentPhone,
                }}
                onSubmit={handleSubmit}
                isLoading={isSubmitting}
                error={formError}
                onResetError={() => setFormError(null)}
                onDirtyChange={(dirty) => { if (dirty) markDirty(); }}
              />
            </YStack>
          </ScrollView>

          {isDirty && (
            <SubmitComponent
              onPress={() => formRef.current?.submit()}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              title={t("save")}
            />
          )}
        </YStack>
      </KeyboardAvoidingView>
    </View>
  );
}
