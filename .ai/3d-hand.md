# Edycja Dłoni i Palców - Hand Editor Design

## Model 3D - Pełna Hierarchia Palców

Model ma kompletną hierarchię dla obu dłoni. Po sanityzacji GLTFLoader (usunięcie kropek):

**Lewa dłoń (DEF-handL) - 5 palców × 3 segmenty:**

- 🤍 Kciuk: `DEF-thumb01L` → `DEF-thumb02L` → `DEF-thumb03L`
- ☝️ Palec wskazujący: `DEF-f_index01L` → `DEF-f_index02L` → `DEF-f_index03L`
- ☞ Palec środkowy: `DEF-f_middle01L` → `DEF-f_middle02L` → `DEF-f_middle03L`
- ☟ Palec serdeczny: `DEF-f_ring01L` → `DEF-f_ring02L` → `DEF-f_ring03L`
- ☡ Mały palec: `DEF-f_pinky01L` → `DEF-f_pinky02L` → `DEF-f_pinky03L`

**Prawa dłoń (DEF-handR):** - identycznie z `.R` na końcu

**Razem:** 30 kości dostępnych do edycji

---

## Proponowane Rozwiązanie: Visual Hand Editor Tab

### Architektura UI

```
┌─────────────────────────────────┐
│     3D Scene (55%)              │
│  - Postać 3D                    │
│  - Marker na dłoń               │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│   Step Strip (52px)             │
│  [1][2][3][+]                   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│   HAND EDITOR TAB (40%)         │
│                                 │
│  [Lewa]  [Prawa]               │
│                                 │
│  Wybierz palec:                 │
│  [👍][☝️][☞][☟][☡]              │
│                                 │
│  Segment: [1] [2] [3]           │
│                                 │
│  Rotacja X: [════•══]           │
│  Rotacja Y: [═•════]            │
│  Rotacja Z: [════•══]           │
│                                 │
│  [Załaduj Preset]  [Zapisz]     │
└─────────────────────────────────┘
```

---

## 1. Enumerem - Fingers Config

```typescript
// @/modules/threed/types/hand.ts

export const FINGER_CONFIGS = {
  thumb: {
    label: "finger.thumb",
    icon: "👍",
    bones: ["DEF-thumb01L", "DEF-thumb02L", "DEF-thumb03L"] as const,
  },
  index: {
    label: "finger.index",
    icon: "☝️",
    bones: ["DEF-f_index01L", "DEF-f_index02L", "DEF-f_index03L"] as const,
  },
  middle: {
    label: "finger.middle",
    icon: "☞",
    bones: ["DEF-f_middle01L", "DEF-f_middle02L", "DEF-f_middle03L"] as const,
  },
  ring: {
    label: "finger.ring",
    icon: "☟",
    bones: ["DEF-f_ring01L", "DEF-f_ring02L", "DEF-f_ring03L"] as const,
  },
  pinky: {
    label: "finger.pinky",
    icon: "☡",
    bones: ["DEF-f_pinky01L", "DEF-f_pinky02L", "DEF-f_pinky03L"] as const,
  },
} as const;

export type FingerType = keyof typeof FINGER_CONFIGS;

export interface FingerPose {
  [K in FingerType]: BoneTransform[];
}

export interface HandPose {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  userId: string;
  side: "left" | "right";
  fingers: FingerPose;
}
```

**Konwersja do `FK_BONE_GROUPS`:** (już dodane w fk.ts)

- `leftHand` - zawiera `DEF-handL` + wszystkie palce lewej dłoni
- `rightHand` - zawiera `DEF-handR` + wszystkie palce prawej dłoni

---

## 2. HandEditorTab - Komponent

```typescript
// @/modules/threed/components/HandEditorTab.tsx

interface HandEditorTabProps {
  selectedBone: FKBoneName | null;
  boneTransforms: BoneTransformMap;
  onBoneSelect: (boneName: FKBoneName) => void;
  onRotationChange: (boneName: string, quat: Quat) => void;
  onSavePreset: (name: string, description: string) => Promise<void>;
  onLoadPreset: (preset: HandPose) => void;
}

export const HandEditorTab: React.FC<HandEditorTabProps> = ({
  selectedBone,
  boneTransforms,
  onBoneSelect,
  onRotationChange,
  onSavePreset,
  onLoadPreset,
}) => {
  const [selectedFinger, setSelectedFinger] = useState<FingerType>("thumb");
  const [selectedSegment, setSelectedSegment] = useState<0 | 1 | 2>(0);
  const [showPresets, setShowPresets] = useState(false);

  const isLeftHand = selectedBone === "DEF-handL";
  const isRightHand = selectedBone === "DEF-handR";
  const isHandSelected = isLeftHand || isRightHand;

  if (!isHandSelected) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        gap="$3"
        padding="$4"
      >
        <Text fontSize="$5" fontWeight="700" textAlign="center">
          {t("hand.selectHandToEdit")}
        </Text>
        <Text fontSize="$3" color="$colorSubtle" textAlign="center">
          {t("hand.clickOnHandIn3D")}
        </Text>
      </YStack>
    );
  }

  // Get bones for current hand
  const fingerConfig = FINGER_CONFIGS[selectedFinger];
  const bonesForHand = fingerConfig.bones.map((boneName) => {
    // Konwertuj L→R jeśli potrzeba
    return isRightHand ? boneName.replace("L", "R") : boneName;
  });

  const currentBoneName = bonesForHand[selectedSegment];
  const currentTransform = boneTransforms[currentBoneName];

  const handleSegmentSelect = (idx: 0 | 1 | 2) => {
    setSelectedSegment(idx);
    onBoneSelect(bonesForHand[idx] as FKBoneName);
  };

  return (
    <YStack flex={1} backgroundColor="$background" gap="$2" padding="$2">
      {/* Hand Selection */}
      <XStack gap="$2" justifyContent="center">
        <Button
          size="$2"
          theme={isLeftHand ? "active" : undefined}
          onPress={() => onBoneSelect("DEF-handL")}
        >
          {t("hand.left")}
        </Button>
        <Button
          size="$2"
          theme={isRightHand ? "active" : undefined}
          onPress={() => onBoneSelect("DEF-handR")}
        >
          {t("hand.right")}
        </Button>
      </XStack>

      {/* Finger Selection */}
      <YStack
        backgroundColor="$backgroundHover"
        borderRadius="$4"
        padding="$3"
        gap="$2"
      >
        <Text fontSize="$2" fontWeight="600" color="$colorSubtle">
          {t("hand.selectFinger")}
        </Text>

        <XStack gap="$2" justifyContent="space-around">
          {(Object.entries(FINGER_CONFIGS) as Array<[FingerType, any]>).map(
            ([finger, config]) => (
              <Pressable
                key={finger}
                onPress={() => {
                  setSelectedFinger(finger);
                  setSelectedSegment(0); // Reset do segmentu 1
                  handleSegmentSelect(0);
                }}
              >
                <YStack
                  width={50}
                  height={60}
                  alignItems="center"
                  justifyContent="center"
                  gap="$1"
                  backgroundColor={
                    selectedFinger === finger ? "$blue9" : "$backgroundStrong"
                  }
                  borderRadius="$2"
                  borderWidth={2}
                  borderColor={
                    selectedFinger === finger ? "$blue9" : "transparent"
                  }
                >
                  <Text fontSize="$4">{config.icon}</Text>
                  <Text
                    fontSize="$1"
                    fontWeight="600"
                    color={selectedFinger === finger ? "white" : "$color"}
                  >
                    {t(config.label)}
                  </Text>
                </YStack>
              </Pressable>
            )
          )}
        </XStack>
      </YStack>

      {/* Segment Selection */}
      <YStack
        backgroundColor="$backgroundHover"
        borderRadius="$3"
        padding="$2"
        gap="$2"
      >
        <Text fontSize="$2" fontWeight="600" color="$colorSubtle">
          {t("hand.segment")}
        </Text>
        <XStack gap="$2">
          {[0, 1, 2].map((idx) => (
            <Button
              key={idx}
              flex={1}
              size="$2"
              theme={selectedSegment === idx ? "active" : undefined}
              onPress={() => handleSegmentSelect(idx as 0 | 1 | 2)}
            >
              {idx + 1}
            </Button>
          ))}
        </XStack>
      </YStack>

      {/* Rotation Controls */}
      <YStack
        flex={1}
        backgroundColor="$backgroundHover"
        borderRadius="$3"
        padding="$2"
        gap="$2"
      >
        <Text fontSize="$2" fontWeight="600" color="$colorSubtle">
          {t("hand.rotateSegment")} {selectedSegment + 1}
        </Text>

        {/* Słabszy sliders - można wyciągnąć z BoneControlPanel */}
        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <YStack gap="$3">
            {/* HSlider X, VSlider Y, Slider Z */}
            {/* TODO: Zintegrować sliderkami z BoneControlPanel */}
          </YStack>
        </ScrollView>
      </YStack>

      {/* Action Buttons */}
      <XStack gap="$2">
        <Button
          flex={1}
          size="$2"
          variant="outlined"
          onPress={() => setShowPresets(true)}
        >
          {t("hand.loadPreset")}
        </Button>
        <Button flex={1} size="$2" onPress={() => setShowPresets(true)}>
          {t("hand.saveAsPreset")}
        </Button>
      </XStack>

      {/* Hand Presets Sheet */}
      {/* TODO: Dodać HandPresetsSheet modal */}
    </YStack>
  );
};
```

---

## 3. Hook do Edycji Dłoni

```typescript
// @/modules/threed/hooks/useHandEditor.ts

export const useHandEditor = () => {
  const [selectedHand, setSelectedHand] = useState<"left" | "right">("left");
  const [handPresets, setHandPresets] = useState<HandPose[]>([]);

  const loadUserHandPresets = async (hand: "left" | "right") => {
    const currentUserId = getCurrentUserId(); // z auth
    const presets = await BodyPosePresetRepository.findByUserIdAndBodyPart(
      currentUserId,
      `hand_${hand}`,
    );
    setHandPresets(presets);
    return presets;
  };

  const captureCurrentHandPose = (
    hand: "left" | "right",
    boneTransforms: BoneTransformMap,
  ): HandPose["fingers"] => {
    const fingers: Record<FingerType, BoneTransform[]> = {};

    (Object.entries(FINGER_CONFIGS) as Array<[FingerType, any]>[]).forEach(
      ([fingerType, config]) => {
        const bones = config.bones.map((boneName: string) => {
          // Zamień L→R jeśli potrzeba
          const adjustedName =
            hand === "right" ? boneName.replace("L", "R") : boneName;
          return (
            boneTransforms[adjustedName] || {
              rotation: { x: 0, y: 0, z: 0, w: 1 },
            }
          );
        });
        fingers[fingerType] = bones;
      },
    );

    return fingers;
  };

  const saveHandAsPreset = async (
    name: string,
    description: string,
    hand: "left" | "right",
    boneTransforms: BoneTransformMap,
  ) => {
    const config = {
      type: "hand_pose",
      side: hand,
      fingers: captureCurrentHandPose(hand, boneTransforms),
    };

    await BodyPosePresetRepository.create({
      userId: getCurrentUserId(),
      name,
      description,
      bodyPart: `hand_${hand}`,
      config,
    });

    // Reload presets
    await loadUserHandPresets(hand);
  };

  const applyHandPreset = (
    preset: HandPose,
    onRotationChange: (boneName: string, quat: Quat) => void,
  ) => {
    const hand = preset.side;

    (
      Object.entries(preset.fingers) as Array<[FingerType, BoneTransform[]]>[]
    ).forEach(([fingerType, transforms]) => {
      const config = FINGER_CONFIGS[fingerType];
      const bones = config.bones.map((boneName) =>
        hand === "right" ? boneName.replace("L", "R") : boneName,
      );

      bones.forEach((boneName, idx) => {
        if (transforms[idx]?.rotation) {
          onRotationChange(boneName, transforms[idx].rotation);
        }
      });
    });
  };

  return {
    selectedHand,
    setSelectedHand,
    handPresets,
    loadUserHandPresets,
    saveHandAsPreset,
    applyHandPreset,
  };
};
```

---

## 4. Integracja w Edit.tsx

```typescript
// app/threed/[sequenceId]/edit.tsx

import { HandEditorTab } from "@/modules/threed/components";
import { useHandEditor } from "@/modules/threed/hooks";

export default function EditorScreen() {
  // ... existing hooks ...
  const { saveHandAsPreset, applyHandPreset } = useHandEditor();
  const [showHandEditor, setShowHandEditor] = useState(false);

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* 3D Scene */}
      <YStack flex={55}>{/* ... */}</YStack>

      {/* Step Strip */}
      <XStack height={52}>{/* ... */}</XStack>

      {/* Bottom Panel */}
      <YStack flex={40}>
        {showHandEditor && (selectedBone === "DEF-handL" || selectedBone === "DEF-handR") ? (
          <HandEditorTab
            selectedBone={selectedBone}
            boneTransforms={boneTransforms}
            onBoneSelect={setSelectedBone}
            onRotationChange={handleBoneRotationChange}
            onSavePreset={(name, desc) =>
              saveHandAsPreset(name, desc, selectedBone === "DEF-handL" ? "left" : "right", boneTransforms)
            }
            onLoadPreset={(preset) =>
              applyHandPreset(preset, handleBoneRotationChange)
            }
          />
        ) : selectedBone ? (
          <BoneControlPanel
            /* ... */
            />
        ) : (
          <XStack flex={1} alignItems="center" justifyContent="center">
            <Text>{t("threedNoBoneSelected")}</Text>
          </XStack>
        )}

        {/* Global Actions */}
        <XStack padding="$2" gap="$2" flexWrap="wrap" justifyContent="center">
          {/* Existing buttons */}

          {(selectedBone === "DEF-handL" || selectedBone === "DEF-handR") && (
            <Button
              size="$3"
              theme={showHandEditor ? "active" : undefined}
              onPress={() => setShowHandEditor(!showHandEditor)}
            >
              {t("hand.handEditor")}
            </Button>
          )}
        </XStack>
      </YStack>
    </YStack>
  );
}
```

---

## 5. Repository Update

```typescript
// @/modules/threed/repositories/bodyPosePresetRepository.ts

export const BodyPosePresetRepository = {
  async findByUserIdAndBodyPart(
    userId: string,
    bodyPart: string,
  ): Promise<BodyPosePreset[]> {
    const collection = database.get<BodyPosePreset>("body_pose_presets");
    return await collection
      .query(
        Q.where("user_id", userId),
        Q.where("body_part", bodyPart),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc),
      )
      .fetch();
  },
  // ... rest existing methods ...
};
```

---

## 6. Translations

### en.json

```json
{
  "hand": {
    "handEditor": "Hand Editor",
    "selectHandToEdit": "Select a hand to edit",
    "clickOnHandIn3D": "Click on DEF-handL or DEF-handR in the 3D view",
    "left": "Left",
    "right": "Right",
    "selectFinger": "Select finger",
    "segment": "Segment",
    "rotateSegment": "Rotate segment",
    "loadPreset": "Load Preset",
    "saveAsPreset": "Save as Preset",
    "presetName": "Preset name",
    "presetDescription": "Description",
    "noPresetsYet": "No hand presets yet"
  },
  "finger": {
    "thumb": "Thumb",
    "index": "Index",
    "middle": "Middle",
    "ring": "Ring",
    "pinky": "Pinky"
  }
}
```

### pl.json

```json
{
  "hand": {
    "handEditor": "Edytor Dłoni",
    "selectHandToEdit": "Wybierz dłoń do edycji",
    "clickOnHandIn3D": "Kliknij na DEF-handL lub DEF-handR w widoku 3D",
    "left": "Lewa",
    "right": "Prawa",
    "selectFinger": "Wybierz palec",
    "segment": "Segment",
    "rotateSegment": "Obróć segment",
    "loadPreset": "Załaduj preset",
    "saveAsPreset": "Zapisz jako preset",
    "presetName": "Nazwa presetu",
    "presetDescription": "Opis",
    "noPresetsYet": "Brak presetów dłoni"
  },
  "finger": {
    "thumb": "Kciuk",
    "index": "Wskazujący",
    "middle": "Środkowy",
    "ring": "Serdeczny",
    "pinky": "Mały palec"
  }
}
```

---

## 7. UX Flow - Praktycznie

**Edycja zaciśniętej pięści:**

1. User klika na `DEF-handL` w 3D
2. Widzi `BoneControlPanel`
3. Klika `[Hand Editor]` button
4. Panel zmienia się na `HandEditorTab`
5. Klika палец "Index" (☝️)
6. Widzi 3 segmenty [1][2][3]
7. Klika [1]
8. Edytuje rotację (sliderkami X, Y, Z)
9. Widzi zginanie palca w 3D real-time
10. Powtarza dla pozostałych palców
11. Klika `[Save as Preset]` → wpisuje "Closed Fist" → Save
12. Preset w bazie (user_id) do szybkiego ładowania

**Czas:** ~1-2 minuty pierwsza pozycja, 2 sekundy załadowanie presetem

---

## 8. Podsumowanie

| Aspekt           | Rozwiązanie                                                 |
| ---------------- | ----------------------------------------------------------- |
| **UX**           | Visual finger picker + segment tabs + rotation sliders      |
| **Spójność**     | Użycie FK_BONES enumerem (DEF-thumb01L, itd.)               |
| **Presets**      | User-owned (user_id), per-hand                              |
| **Data**         | BodyPosePreset z config zawierającym dane wszystkich palców |
| **Intuicyjność** | Klikalne palce + emoji ikony                                |
| **Elastyczność** | Edycja każdego segmentu każdego palca                       |

---

## Czekające TODO

- [ ] Zintegrowать sliderkami rotacji z HandEditorTab
- [ ] Dodać HandPresetsSheet modal
- [ ] Dodati test dla bone name conversion (L ↔ R)
- [ ] Dodać FK_BODY_GROUPS entries dla leftHand i rightHand (w progresie)
