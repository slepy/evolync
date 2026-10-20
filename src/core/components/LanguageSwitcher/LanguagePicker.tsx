import React, { useState } from "react";
import { neutral } from "@/core/theme/tokens";
import { ChevronDown, Globe } from "lucide-react-native";
import { Text, XStack } from "tamagui";
import { useTranslation } from "@/core/hooks/useTranslation";
import { changeLanguage, DEFAULT_LANGUAGE, getAvailableLanguages } from "@/core/i18n/config";
import { FormSheet } from "../FormSheet";
import { ListCard, ListCheck, ListRow } from "../List";

/**
 * Language pill for the corner of the sign in screen: the short code of the
 * current language ("EN"); a tap opens a sheet with every language, each in
 * its own language. The choice is kept on this device only.
 */
export const LanguagePicker: React.FC = () => {
  const { t, language } = useTranslation();
  const [open, setOpen] = useState(false);
  const languages = getAvailableLanguages();
  const current = languages.find((lang) => lang.code === language) ?? languages.find((lang) => lang.code === DEFAULT_LANGUAGE)!;

  return (
    <>
      <XStack
        role="button"
        aria-label={t("languageChange", { language: current.label })}
        onPress={() => setOpen(true)}
        pressStyle={{ opacity: 0.8 }}
        hitSlop={7}
        alignItems="center"
        gap={5}
        height={30}
        paddingHorizontal={12}
        borderRadius={15}
        backgroundColor="$neutralRaised"
        borderWidth={1}
        borderColor="$neutralRaisedBorder"
      >
        <Globe size={14} color={neutral.muted} strokeWidth={2.4} />
        <Text fontSize={12} fontWeight="700" color="$neutralText">
          {current.short}
        </Text>
        <ChevronDown size={14} color={neutral.muted} strokeWidth={2.4} />
      </XStack>
      <FormSheet open={open} onOpenChange={setOpen} title={t("language")}>
        <ListCard role="group" aria-label={t("language")}>
          {languages.map((lang) => {
            const selected = lang.code === current.code;
            return (
              <ListRow
                key={lang.code}
                size="md"
                role="option"
                title={lang.label}
                subtitle={lang.short}
                aria-selected={selected}
                trailing={selected ? <ListCheck accent="light" /> : undefined}
                onPress={() => {
                  setOpen(false);
                  if (!selected) changeLanguage(lang.code).catch(console.error);
                }}
              />
            );
          })}
        </ListCard>
      </FormSheet>
    </>
  );
};
