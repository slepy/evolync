import School from "@/database/models/School";
import SchoolSettings from "@/database/models/SchoolSettings";
import { LoadingScreen } from "@/modules/core/components/LoadingScreen";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { SchoolSettingsScreen } from "@/modules/school/components";
import { SchoolRepository, SchoolSettingsRepository } from "@/modules/school/repositories";
import { createOrUpdateSchoolSettings, updateSchool } from "@/modules/school/services";
import type { CombinedSchoolSettingsFormValues } from "@/modules/school/validation";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

/** School settings (15A / 15B): name, address and payment defaults; owner only. */
export default function SchoolSettingsRoute() {
  useRequireOrganizationOwner();
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();
  const [school, setSchool] = useState<School | null>(null);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([SchoolRepository.findById(schoolId), SchoolSettingsRepository.findBySchoolId(schoolId)])
      .then(([schoolRecord, settingsRecord]) => {
        setSchool(schoolRecord);
        setSettings(settingsRecord);
      })
      .catch((err) => console.error("[SchoolSettings] Load error:", err))
      .finally(() => setLoaded(true));
  }, [schoolId]);

  if (!loaded || !school || !schoolId) return <LoadingScreen />;

  // Both services sync after the write.
  const handleSubmit = async (data: CombinedSchoolSettingsFormValues) => {
    await updateSchool(schoolId, { name: data.name, address: data.address });
    await createOrUpdateSchoolSettings(schoolId, {
      defaultCurrency: data.defaultCurrency,
      defaultPaymentAmount: data.defaultPaymentAmount,
    });
    router.back();
  };

  return (
    <SchoolSettingsScreen
      initial={{
        name: school.name,
        address: school.address,
        defaultCurrency: settings?.defaultCurrency,
        defaultPaymentAmount: settings?.defaultPaymentAmount,
      }}
      onSubmit={handleSubmit}
    />
  );
}
