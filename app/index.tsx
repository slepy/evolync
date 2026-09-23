import { useStore } from "@/store";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

// ============================================================================
// Index Screen - Auth Guard
// ============================================================================

export default function IndexScreen() {
  const router = useRouter();
  const { user, organization } = useStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const timer = setTimeout(() => {
      if (user) {
        if (organization) {
          router.replace("/organization/dashboard" as any);
        } else {
          router.replace("/user/dashboard" as any);
        }
      } else {
        router.replace("/auth/login" as any);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, organization, isMounted]);

  return null;
}
