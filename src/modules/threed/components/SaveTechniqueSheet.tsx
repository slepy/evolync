import { FormSheet, PrimaryButton, resolveListAccent, TextField } from "@/core/components";
import { PersonStanding } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Text, View, XStack, YStack } from "tamagui";
import { bodyPartLabelKey } from "../library";
import { FK_BODY_GROUPS, type FKBodyGroup } from "../types/fk";
import { THREED_TITLE_MAX } from "../validation";

const lime = resolveListAccent("threed");

export interface SaveTechniqueSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Body part of the selected joint; "fullbody" saves a starting position. */
  bodyPart: FKBodyGroup;
  /** Saves it; a rejection keeps the sheet open with the error under the name. */
  onSave: (title: string) => Promise<void> | void;
}

/**
 * New technique / starting position over the editor (D11): BODY PART it
 * covers with its joint count, NAME, Save in 3D lime.
 */
export function SaveTechniqueSheet({ open, onOpenChange, bodyPart, onSave }: SaveTechniqueSheetProps) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const position = bodyPart === "fullbody";

  useEffect(() => {
    if (open) {
      setTitle("");
      setError(undefined);
    }
  }, [open]);

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    setError(undefined);
    try {
      await onSave(title.trim());
      onOpenChange(false);
    } catch (err) {
      console.error("[SaveTechniqueSheet] save:", err);
      setError(t(err instanceof Error ? err.message : "errorSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t(position ? "threedNewPosition" : "threedNewTechnique")}
      footer={
        <PrimaryButton label={t("save")} accent="threed" onPress={handleSave} disabled={!title.trim()} loading={saving} />
      }
    >
      <YStack gap={8}>
        <Text fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted">
          {t("threedBodyPart")}
        </Text>
        <XStack
          alignItems="center"
          gap={12}
          height={52}
          paddingHorizontal={14}
          borderRadius={16}
          borderWidth={1}
          borderColor="$neutralRaisedBorder"
          backgroundColor="$neutralCard"
        >
          <View width={32} height={32} borderRadius={10} backgroundColor={lime.fill} alignItems="center" justifyContent="center">
            <PersonStanding size={18} color={lime.tint} strokeWidth={2.2} />
          </View>
          <Text flex={1} fontSize={15} fontWeight="$button" color="$neutralText" numberOfLines={1}>
            {t(bodyPartLabelKey(bodyPart))}
          </Text>
          <Text fontSize={12.5} fontWeight="600" color="$neutralMuted">
            {t("threedJointCount", { count: FK_BODY_GROUPS[bodyPart].length })}
          </Text>
        </XStack>
      </YStack>
      <TextField
        size="large"
        label={t("fieldName")}
        value={title}
        onChangeText={(next) => {
          setTitle(next);
          setError(undefined);
        }}
        placeholder={t(position ? "threedPositionNamePlaceholder" : "threedTechniqueNamePlaceholder")}
        accent="threed"
        maxLength={THREED_TITLE_MAX}
        error={error}
        autoFocus
      />
    </FormSheet>
  );
}
