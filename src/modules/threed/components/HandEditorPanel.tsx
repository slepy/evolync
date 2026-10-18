import {
  FormSheet,
  ListCard,
  ListEmpty,
  ListIcon,
  ListRow,
  ListSection,
  PrimaryButton,
  resolveListAccent,
  TextField,
} from "@/core/components";
import { LinearGradient } from "expo-linear-gradient";
import { Hand } from "lucide-react-native";
import { useState } from "react";
import { ScrollView } from "react-native";
import { Text, View, XStack, YStack } from "tamagui";
import { useHandPresetsByUserAndSide } from "../hooks/useHandPresetsByUserAndSide";
import { formatDeg, ROTATE_RANGE_DEG, quatToEulerDeg, withAxisDeg, type Axis } from "../jointAxes";
import type { Quat } from "../types/data";
import { FINGER_LABEL_KEYS, FINGER_TYPE, getFingerBone, type BoneTransformMap, type FingerType, type FKBoneName } from "../types/fk";
import { THREED_TITLE_MAX } from "../validation";
import { AxisSlider } from "./AxisSlider";
import { AXIS_COLORS } from "./JointPanel";

const lime = resolveListAccent("threed");
const SEGMENTS = [1, 2, 3] as const;
type Part = "hand" | FingerType;
const PARTS: Part[] = ["hand", ...Object.values(FINGER_TYPE)];
/** Fingers bend on X and spread on Z (D10); the hand itself turns on all three. */
const FINGER_AXES: Axis[] = ["x", "z"];
const HAND_AXES: Axis[] = ["x", "y", "z"];

export interface HandEditorPanelProps {
  side: "L" | "R";
  boneTransforms: BoneTransformMap;
  onRotationChange: (bone: string, rotation: Quat) => void;
  /** Saves every bone of this hand as a named preset. */
  onSavePreset: (name: string) => Promise<void>;
  onApplyPreset: (transforms: BoneTransformMap) => void;
}

/**
 * Hand editor (D10): Hand / Thumb … Little, SEGMENT 1–3, X and Z sliders of
 * the chosen bone, and the user's presets for this hand with Add new.
 */
export function HandEditorPanel({ side, boneTransforms, onRotationChange, onSavePreset, onApplyPreset }: HandEditorPanelProps) {
  const [part, setPart] = useState<Part>("index");
  const [segment, setSegment] = useState<1 | 2 | 3>(1);
  const [saveOpen, setSaveOpen] = useState(false);
  const { presets } = useHandPresetsByUserAndSide(side);

  const bone: FKBoneName = part === "hand" ? (`DEF-hand${side}` as FKBoneName) : getFingerBone(part, segment, side);
  const rotation = boneTransforms[bone]?.rotation;
  const euler = quatToEulerDeg(rotation);
  const handLabel = t(side === "R" ? "boneRightHand" : "boneLeftHand");

  return (
    <YStack gap={16}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginRight: -20 }}>
        <XStack role="radiogroup" aria-label={t("threedFinger")} gap={6} paddingRight={20}>
          {PARTS.map((value) => (
            <PartChip
              key={value}
              label={t(value === "hand" ? "threedHand" : FINGER_LABEL_KEYS[value])}
              on={value === part}
              onPress={() => setPart(value)}
            />
          ))}
        </XStack>
      </ScrollView>

      {part !== "hand" ? (
        <XStack alignItems="center" gap={8}>
          <Text flex={1} fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted">
            {t("threedSegment")}
          </Text>
          {SEGMENTS.map((n) => {
            const on = n === segment;
            return (
              <View
                key={n}
                role="radio"
                aria-checked={on}
                aria-label={t("threedSegmentNumber", { n })}
                onPress={() => setSegment(n)}
                pressStyle={{ opacity: 0.85 }}
                width={40}
                height={40}
                borderRadius={20}
                borderWidth={on ? 1.5 : 1}
                borderColor={on ? lime.tint : "$neutralRaisedBorder"}
                backgroundColor={on ? lime.fill : "$neutralPage"}
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize={14} fontWeight="$button" color={on ? lime.tint : "$neutralSoft"}>
                  {n}
                </Text>
              </View>
            );
          })}
        </XStack>
      ) : null}

      <YStack gap={6}>
        {(part === "hand" ? HAND_AXES : FINGER_AXES).map((axis) => (
          <AxisSlider
            key={`${bone}-${axis}`}
            axis={axis.toUpperCase()}
            color={AXIS_COLORS[axis]}
            value={euler[axis]}
            range={ROTATE_RANGE_DEG}
            format={formatDeg}
            onChange={(deg) => onRotationChange(bone, withAxisDeg(rotation, axis, deg))}
          />
        ))}
      </YStack>

      <ListSection
        title={t("threedPresets")}
        accent="threed"
        action={{ label: t("addNew"), onPress: () => setSaveOpen(true) }}
      >
        {presets.length > 0 ? (
          <ListCard aria-label={t("threedPresets")}>
            {presets.map((preset) => (
              <ListRow
                key={preset.id}
                title={preset.name}
                subtitle={`${handLabel} · ${t("threedJointCount", { count: Object.keys(preset.presetData).length })}`}
                leading={<ListIcon icon={Hand} accent="threed" size={44} />}
                onPress={() => onApplyPreset(preset.presetData)}
              />
            ))}
          </ListCard>
        ) : (
          <ListEmpty text={t("threedNoPresets")} hint={t("threedNoPresetsHint")} />
        )}
      </ListSection>

      <SavePresetSheet open={saveOpen} onOpenChange={setSaveOpen} onSave={onSavePreset} />
    </YStack>
  );
}

/** 36px finger chip: lime gradient when chosen, page fill otherwise. */
function PartChip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const text = (
    <Text fontSize={13} fontWeight="$button" color={on ? lime.onGradient : "$neutralSoft"}>
      {label}
    </Text>
  );
  return (
    <View
      role="radio"
      aria-checked={on}
      aria-label={label}
      onPress={onPress}
      pressStyle={{ opacity: 0.85 }}
      height={36}
      borderRadius={18}
      overflow="hidden"
      borderWidth={on ? 0 : 1}
      borderColor="$neutralRaisedBorder"
      backgroundColor={on ? undefined : "$neutralPage"}
      justifyContent="center"
    >
      {on ? (
        <LinearGradient
          colors={[lime.from, lime.to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height: 36, paddingHorizontal: 13, justifyContent: "center" }}
        >
          {text}
        </LinearGradient>
      ) : (
        <View paddingHorizontal={13}>{text}</View>
      )}
    </View>
  );
}

function SavePresetSheet({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(undefined);
    try {
      await onSave(name.trim());
      setName("");
      onOpenChange(false);
    } catch (err) {
      console.error("[HandEditorPanel] save preset:", err);
      setError(t(err instanceof Error ? err.message : "handPresetSaveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("threedNewPreset")}
      footer={<PrimaryButton label={t("save")} accent="threed" onPress={handleSave} disabled={!name.trim()} loading={saving} />}
    >
      <TextField
        size="large"
        label={t("fieldName")}
        value={name}
        onChangeText={(next) => {
          setName(next);
          setError(undefined);
        }}
        placeholder={t("threedPresetNamePlaceholder")}
        accent="threed"
        maxLength={THREED_TITLE_MAX}
        error={error}
        autoFocus
      />
    </FormSheet>
  );
}
