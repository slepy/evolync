# Plan Implementacji: Moduł 3D dla Evolync

## Context

Moduł 3D umożliwi użytkownikom (instruktorom i uczniom) tworzenie, edytowanie i przeglądanie sekwencji technik sztuk walki przy użyciu interaktywnych modeli 3D z systemem Inverse Kinematics (IK). Funkcjonalność jest opisana w szczegółowym PRD (`.ai/3d-prd.md`) i stanowi kluczową wartość dodaną aplikacji Evolync.

**Kluczowe wymagania:**

- **Offline-first**: Pełna funkcjonalność bez połączenia z internetem
- **Prywatność**: Wszystkie sekwencje są prywatne dla użytkownika
- **Multi-actor**: Obsługa do 2 modeli (Main Actor + Partner)
- **IK System**: Drag & Drop dla nadgarstków, kostek, bioder
- **Hand Presets**: Predefiniowane kształty dłoni + rotacja nadgarstka
- **Przeglądarka**: Slideshow z interpolacją 500ms między krokami

**Stan obecny:**

- ✅ Tabele Supabase już istnieją (migracja `20260129120000_update_3d_schema.sql`)
- ✅ React Three Fiber zainstalowany (v9.4.2)
- ✅ Model human.glb dostępny w `assets/models/`
- ❌ Brak schematu WatermelonDB dla tabel 3D
- ❌ Brak modeli WatermelonDB
- ❌ Brak repozytoriów, serwisów, komponentów 3D
- ❌ Brak modułu `src/modules/threed/`

## Recommended Approach

Implementacja będzie przeprowadzona w 5 fazach:

### Faza 1: Fundament - Schema i Modele WatermelonDB

**1.1 Utworzenie modułu 3D:**

```
src/modules/threed/
├── database/
│   └── schema.ts          # Definicje tabel WatermelonDB
├── repositories/
├── services/
├── hooks/
├── components/
├── utils/
├── types/
└── validation/
```

**1.2 Definicja schematu WatermelonDB:**

Utworzyć `src/modules/threed/database/schema.ts` z 5 tabelami:

- **body_pose_presets** - Predefiniowane kształty dłoni/stóp
  - `name`, `body_part_type` (hand/foot), `data` (JSONB), `is_system`

- **techniques** - Atomowe techniki (częściowe lub fullbody)
  - `user_id`, `title`, `description`, `body_part` (left_arm|right_arm|left_leg|right_leg|torso|fullbody), `data` (JSONB snapshot)

- **sequences** - Kolekcje kroków z metadanymi
  - `user_id`, `title`, `description`, `cover_image_url`

- **sequence_steps** - Snapshoty pełnej sceny w danym momencie
  - `sequence_id`, `order_index`, `duration_ms`, `data` (JSONB full scene)

- **step_techniques** - Tabela łącząca (Technique → Step masking)
  - `step_id`, `technique_id`, `model_slot`, `root_position`, `root_rotation`

**Struktura JSON w polach `data`:**

```typescript
// techniques.data - częściowa technika (np. body_part = 'left_arm')
{
  bodyPart: 'left_arm' | 'right_arm' | 'left_leg' | 'right_leg' | 'torso',
  targets: {
    leftWrist: { x: 0.5, y: 1.2, z: 0.3 },
    // tylko targety dotyczące danej części ciała
  },
  handPresets: {
    left: { presetId: 'uuid', wristRotation: { x, y, z, w } },
    // tylko jeśli dotyczy ręki
  }
}

// techniques.data - pełna technika / pozycja startowa (body_part = 'fullbody')
{
  bodyPart: 'fullbody',
  targets: {
    leftWrist: { x: 0.5, y: 1.2, z: 0.3 },
    rightWrist: { x: -0.5, y: 1.2, z: 0.3 },
    leftAnkle: { x: 0.2, y: 0.1, z: 0 },
    rightAnkle: { x: -0.2, y: 0.1, z: 0 },
    hips: { x: 0, y: 1, z: 0 },
  },
  handPresets: {
    left: { presetId: 'uuid', wristRotation: { x, y, z, w } },
    right: { presetId: 'uuid', wristRotation: { x, y, z, w } },
  }
}

// sequence_steps.data
{
  mainActor: {
    targets: { leftWrist: {x,y,z}, ... },
    handPresets: { left: {...}, right: {...} },
    rootPosition: {x,y,z},
    rootRotation: {x,y,z,w}
  },
  partner?: { /* same structure + color */ }
}

// body_pose_presets.data
{
  bones: {
    "LeftFinger1": { rotation: {x,y,z,w} },
    // ...
  }
}
```

**1.3 Utworzenie modeli WatermelonDB:**

W `src/database/models/` utworzyć 5 plików:

- `BodyPosePreset.ts`
- `Technique.ts`
- `Sequence.ts`
- `SequenceStep.ts`
- `StepTechnique.ts`

**Wzorzec modelu** (przykład `Sequence.ts`):

```typescript
import { Model, Query } from "@nozbe/watermelondb";
import {
  field,
  readonly,
  date,
  children,
} from "@nozbe/watermelondb/decorators";
import SequenceStep from "./SequenceStep";

export default class Sequence extends Model {
  static table = "sequences";
  static associations = {
    sequence_steps: { type: "has_many" as const, foreignKey: "sequence_id" },
  };

  @field("user_id") userId!: string;
  @field("title") title!: string;
  @field("description") description?: string;
  @field("cover_image_url") coverImageUrl?: string;

  @children("sequence_steps") steps!: Query<SequenceStep>;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}
```

**Uwaga:** Pola `data` (JSONB) przechowywane jako `@field('data') data!: string` z getter metodą:

```typescript
get techniqueData(): TechniqueData {
  return JSON.parse(this.data);
}
```

**1.4 Aktualizacja centralnego schematu:**

W `src/database/schema.ts`:

- Dodać import: `import { threedSchema } from '@/modules/threed/database/schema';`
- Zwiększyć wersję: `version: 9`
- Dodać do tables: `...threedSchema`

W `src/database/models/index.ts`:

- Eksportować wszystkie 5 modeli

### Faza 2: Warstwa Danych - Repozytoria i Serwisy

**2.1 Repozytoria:**

Utworzyć w `src/modules/threed/repositories/`:

- `bodyPosePresetRepository.ts` - findAll(), findByBodyPart(), observe\*
- `techniqueRepository.ts` - CRUD + findByUserId(), findByBodyPart(), observe\*
- `sequenceRepository.ts` - CRUD + findByUserId(), observe\*
- `sequenceStepRepository.ts` - CRUD + findBySequenceId() (sortBy order_index), observe\*
- `stepTechniqueRepository.ts` - CRUD + findByStepId()
- `index.ts` - re-export

**Wzorzec repozytorium** (standardowy CRUD z UUID generacją):

```typescript
export const SequenceRepository = {
  async create(data: Partial<Sequence>): Promise<Sequence> {
    const collection = database.get<Sequence>("sequences");
    return await database.write(async () => {
      return await collection.create((record) => {
        record._raw.id = uuidv4();
        Object.assign(record, data);
      });
    });
  },

  async findByUserId(userId: string): Promise<Sequence[]> {
    const collection = database.get<Sequence>("sequences");
    return await collection
      .query(
        Q.where("user_id", userId),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc),
      )
      .fetch();
  },

  observeByUserId(userId: string) {
    const collection = database.get<Sequence>("sequences");
    return collection
      .query(
        Q.where("user_id", userId),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc),
      )
      .observe();
  },

  // ... update, softDelete, etc.
};
```

**2.2 Serwisy:**

Utworzyć w `src/modules/threed/services/`:

- `sequenceService.ts` - createSequence, addStepToSequence, updateSequenceCoverImage, deleteSequence
- `techniqueService.ts` - saveTechnique, updateTechnique, deleteTechnique
- `screenshotService.ts` - captureCanvasScreenshot (używa react-native-view-shot)
- `index.ts` - re-export

**Wzorzec serwisu:**

```typescript
import { sync } from "@/database/sync";
import { uploadImage } from "@/modules/core/utils/uploadImage";
import { useStore } from "@/store";
import { SequenceRepository } from "../repositories";

export const createSequence = async (
  data: CreateSequenceDto,
): Promise<Sequence> => {
  const { user } = useStore.getState();

  if (!user) {
    throw new Error("threedErrorNoUser");
  }

  const sequence = await SequenceRepository.create({
    userId: user.id,
    title: data.title,
    description: data.description,
  });

  sync().catch(console.error);
  return sequence;
};

export const updateSequenceCoverImage = async (
  sequenceId: string,
  screenshotUri: string,
): Promise<Sequence> => {
  const { user } = useStore.getState();

  const imageUrl = await uploadImage(screenshotUri, "3d-sequences", user?.id);

  const sequence = await SequenceRepository.update(sequenceId, {
    coverImageUrl: imageUrl,
  });

  sync().catch(console.error);
  return sequence;
};
```

**2.3 Typy DTO:**

Utworzyć `src/modules/threed/types/dto.ts`:

```typescript
export interface CreateSequenceDto {
  title: string;
  description?: string;
}

export const BODY_PART = {
  LEFT_ARM: "left_arm",
  RIGHT_ARM: "right_arm",
  LEFT_LEG: "left_leg",
  RIGHT_LEG: "right_leg",
  TORSO: "torso",
  FULLBODY: "fullbody",
} as const;

export type BodyPart = (typeof BODY_PART)[keyof typeof BODY_PART];

export interface CreateTechniqueDto {
  title: string;
  description?: string;
  bodyPart: BodyPart;
  techniqueData: TechniqueData;
}

export interface TechniqueData {
  bodyPart: BodyPart;
  targets: Record<string, { x: number; y: number; z: number }>;
  handPresets?: {
    left?: { presetId: string; wristRotation: { x; y; z; w } };
    right?: { presetId: string; wristRotation: { x; y; z; w } };
  };
}

// Mapping: body_part → powiązane IK targety (do maskingu)
export const BODY_PART_TARGETS: Record<BodyPart, string[]> = {
  [BODY_PART.LEFT_ARM]: ["leftWrist"],
  [BODY_PART.RIGHT_ARM]: ["rightWrist"],
  [BODY_PART.LEFT_LEG]: ["leftAnkle"],
  [BODY_PART.RIGHT_LEG]: ["rightAnkle"],
  [BODY_PART.TORSO]: ["hips"],
  [BODY_PART.FULLBODY]: [
    "leftWrist",
    "rightWrist",
    "leftAnkle",
    "rightAnkle",
    "hips",
  ],
};

export interface StepData {
  mainActor: ActorData;
  partner?: ActorData & { color: string };
}

export interface ActorData {
  targets: Record<string, { x: number; y: number; z: number }>;
  handPresets: {
    left: { presetId: string; wristRotation: { x; y; z; w } };
    right: { presetId: string; wristRotation: { x; y; z; w } };
  };
  rootPosition: { x: number; y: number; z: number };
  rootRotation: { x: number; y: number; z: number; w: number };
}
```

### Faza 3: System IK i Komponenty 3D

**3.1 Biblioteka IK:**

Używamy **three-stdlib** (już zainstalowany v2.36.1) z `CCDIKSolver`.

Utworzyć `src/modules/threed/utils/ikSystem.ts`:

```typescript
import * as THREE from "three";
import { CCDIKSolver } from "three-stdlib";

export interface IKChain {
  target: string;
  effector: string;
  bones: string[];
  iterations: number;
  constraints?: Record<
    string,
    Array<{ axis: "x" | "y" | "z"; min: number; max: number }>
  >;
}

export const IK_CHAINS: IKChain[] = [
  {
    target: "leftWrist",
    effector: "LeftHand",
    bones: ["LeftShoulder", "LeftUpperArm", "LeftLowerArm", "LeftHand"],
    iterations: 10,
    constraints: {
      LeftLowerArm: [{ axis: "z", min: 0, max: Math.PI * 0.8 }],
    },
  },
  // ... rightWrist, leftAnkle, rightAnkle, hips
];

export class IKSystemManager {
  private solver: CCDIKSolver | null = null;
  private targets: Map<string, THREE.Object3D>;

  constructor(model: THREE.Object3D, chains: IKChain[]) {
    this.targets = new Map();
    this.initializeSolver(model, chains);
  }

  private initializeSolver(model: THREE.Object3D, chains: IKChain[]) {
    // Map chains to CCDIKSolver configuration
    // Create solver instance
  }

  setTargetPosition(targetName: string, position: THREE.Vector3) {
    const target = this.targets.get(targetName);
    if (target) target.position.copy(position);
  }

  update() {
    if (this.solver) this.solver.update();
  }

  dispose() {
    this.solver = null;
    this.targets.clear();
  }
}
```

**UWAGA:** Struktura bone w `human.glb` musi być zweryfikowana. Jeśli nazwy bone różnią się, utworzyć mapping layer.

**3.2 Komponenty React Three Fiber:**

Utworzyć w `src/modules/threed/components/`:

**ThreeDCanvas.tsx** - Główny wrapper:

```typescript
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei/native';

export const ThreeDCanvas: React.FC<{
  children: React.ReactNode;
  cameraControls?: 'orbit' | 'fixed';
}> = ({ children, cameraControls = 'orbit' }) => {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 1.5, 3]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      {children}
      {cameraControls === 'orbit' && (
        <OrbitControls enableZoom enablePan minDistance={2} maxDistance={8} />
      )}
    </Canvas>
  );
};
```

**HumanModel.tsx** - Model 3D z IK:

```typescript
import { useGLTF } from '@react-three/drei/native';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { IKSystemManager, IK_CHAINS } from '../utils/ikSystem';

export const HumanModel: React.FC<{
  modelSlot: 0 | 1;
  color?: string;
  ikTargets: Map<string, THREE.Vector3>;
  handPresets?: { left?: string; right?: string };
}> = ({ modelSlot, color = '#4a90d9', ikTargets }) => {
  const { scene } = useGLTF(require('../../../../assets/models/human.glb'));
  const modelRef = useRef<THREE.Group>(null);
  const [ikSystem, setIkSystem] = useState<IKSystemManager | null>(null);

  useEffect(() => {
    if (!modelRef.current) return;

    const clonedScene = scene.clone(true);

    // Apply color
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          metalness: 0.1,
          roughness: 0.7,
        });
      }
    });

    const ik = new IKSystemManager(clonedScene, IK_CHAINS);
    setIkSystem(ik);

    return () => ik.dispose();
  }, [scene, color]);

  useFrame(() => {
    if (ikSystem) {
      ikTargets.forEach((position, targetName) => {
        ikSystem.setTargetPosition(targetName, position);
      });
      ikSystem.update();
    }
  });

  return (
    <group ref={modelRef} position={[modelSlot * 1.5, 0, 0]}>
      <primitive object={scene.clone(true)} />
    </group>
  );
};
```

**IKTargetGizmo.tsx** - Draggable sphere dla IK target:

```typescript
import { Sphere } from '@react-three/drei/native';
import { ThreeEvent } from '@react-three/fiber';
import { useState } from 'react';
import * as THREE from 'three';

export const IKTargetGizmo: React.FC<{
  targetName: string;
  position: THREE.Vector3;
  onDrag: (name: string, pos: THREE.Vector3) => void;
  isSelected: boolean;
  onSelect: (name: string) => void;
}> = ({ targetName, position, onDrag, isSelected, onSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <Sphere
      args={[0.08, 16, 16]}
      position={position}
      onPointerDown={(e) => {
        e.stopPropagation();
        setIsDragging(true);
        onSelect(targetName);
      }}
      onPointerMove={(e) => {
        if (isDragging) {
          onDrag(targetName, new THREE.Vector3(e.point.x, e.point.y, e.point.z));
        }
      }}
      onPointerUp={() => setIsDragging(false)}
    >
      <meshStandardMaterial
        color={isSelected ? '#ff6600' : '#00ff00'}
        transparent
        opacity={0.7}
      />
    </Sphere>
  );
};
```

**HandPresetPicker.tsx** - Sheet dla wyboru preset dłoni:

```typescript
import { Sheet } from '@tamagui/sheet';
import { YStack, Button } from 'tamagui';
import { useHandPresets } from '../hooks/useHandPresets';

export const HandPresetPicker: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (presetId: string) => void;
}> = ({ isOpen, onClose, onSelect }) => {
  const { presets } = useHandPresets();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Sheet.Frame padding="$4">
        <YStack gap="$2">
          {presets.map((preset) => (
            <Button
              key={preset.id}
              onPress={() => {
                onSelect(preset.id);
                onClose();
              }}
            >
              {preset.name}
            </Button>
          ))}
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
};
```

### Faza 4: Hooki i Logika UI

**4.1 Hooki:**

Utworzyć w `src/modules/threed/hooks/`:

**useSequences.ts** - Lista sekwencji użytkownika:

```typescript
import { useEffect, useState } from "react";
import { useStore } from "@/store";
import Sequence from "@/database/models/Sequence";
import { SequenceRepository } from "../repositories";

export const useSequences = () => {
  const { user } = useStore();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSequences([]);
      setIsLoading(false);
      return;
    }

    const subscription = SequenceRepository.observeByUserId(user.id).subscribe({
      next: (result) => {
        setSequences(result);
        setIsLoading(false);
      },
      error: (err) => {
        console.error("[useSequences] Error:", err);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [user?.id]);

  return { sequences, isLoading };
};
```

**useSequenceEditor.ts** - Zunifikowana logika edytora (sekwencje + techniki):

```typescript
import { useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { addStepToSequence } from "../services/sequenceService";
import { saveTechnique } from "../services/techniqueService";
import {
  BODY_PART,
  BodyPart,
  BODY_PART_TARGETS,
  TechniqueData,
} from "../types/dto";
import Technique from "@/database/models/Technique";

// Mapping: IK target name → body part
const TARGET_TO_BODY_PART: Record<string, BodyPart> = {
  leftWrist: BODY_PART.LEFT_ARM,
  rightWrist: BODY_PART.RIGHT_ARM,
  leftAnkle: BODY_PART.LEFT_LEG,
  rightAnkle: BODY_PART.RIGHT_LEG,
  hips: BODY_PART.TORSO,
};

export const useSequenceEditor = (sequenceId: string) => {
  const [ikTargets, setIkTargets] = useState<Map<string, THREE.Vector3>>(
    new Map([
      ["leftWrist", new THREE.Vector3(-0.5, 1.2, 0.3)],
      ["rightWrist", new THREE.Vector3(0.5, 1.2, 0.3)],
      ["leftAnkle", new THREE.Vector3(-0.2, 0.1, 0)],
      ["rightAnkle", new THREE.Vector3(0.2, 0.1, 0)],
      ["hips", new THREE.Vector3(0, 1, 0)],
    ]),
  );

  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [partnerEnabled, setPartnerEnabled] = useState(false);

  // Resolve selected target → body part (for contextual actions)
  const selectedBodyPart = useMemo<BodyPart | null>(() => {
    if (!selectedTarget) return null;
    return TARGET_TO_BODY_PART[selectedTarget] ?? null;
  }, [selectedTarget]);

  const handleTargetDrag = useCallback((name: string, pos: THREE.Vector3) => {
    setIkTargets((prev) => {
      const newMap = new Map(prev);
      newMap.set(name, pos.clone());
      return newMap;
    });
  }, []);

  // --- Step actions ---

  const saveCurrentStep = useCallback(async () => {
    const stepData: StepData = {
      mainActor: {
        targets: Object.fromEntries(ikTargets),
        handPresets: {
          /* ... */
        },
        rootPosition: { x: 0, y: 0, z: 0 },
        rootRotation: { x: 0, y: 0, z: 0, w: 1 },
      },
    };
    await addStepToSequence(sequenceId, stepData);
  }, [sequenceId, ikTargets]);

  // --- Technique actions (from editor context) ---

  // Save partial technique from currently selected body part
  const saveTechniqueFromSelection = useCallback(
    async (title: string, tag?: string) => {
      if (!selectedBodyPart) return;

      const relevantTargets = BODY_PART_TARGETS[selectedBodyPart];
      const targets: Record<string, { x: number; y: number; z: number }> = {};
      relevantTargets.forEach((targetName) => {
        const pos = ikTargets.get(targetName);
        if (pos) targets[targetName] = { x: pos.x, y: pos.y, z: pos.z };
      });

      await saveTechnique({
        title,
        bodyPart: selectedBodyPart,
        techniqueData: { bodyPart: selectedBodyPart, targets },
      });
    },
    [selectedBodyPart, ikTargets],
  );

  // Save fullbody technique (starting position)
  const saveAsStartingPosition = useCallback(
    async (title: string) => {
      const targets: Record<string, { x: number; y: number; z: number }> = {};
      ikTargets.forEach((pos, name) => {
        targets[name] = { x: pos.x, y: pos.y, z: pos.z };
      });

      await saveTechnique({
        title,
        bodyPart: BODY_PART.FULLBODY,
        techniqueData: {
          bodyPart: BODY_PART.FULLBODY,
          targets,
          handPresets: {
            /* current hand presets */
          },
        },
      });
    },
    [ikTargets],
  );

  // Apply technique to current pose (masking for partial, full override for fullbody)
  const applyTechnique = useCallback((technique: Technique) => {
    const data: TechniqueData = JSON.parse(technique.data);
    setIkTargets((prev) => {
      const newMap = new Map(prev);
      Object.entries(data.targets).forEach(([name, pos]) => {
        newMap.set(name, new THREE.Vector3(pos.x, pos.y, pos.z));
      });
      return newMap;
    });
    // TODO: apply handPresets if present
  }, []);

  // --- Pose manipulation ---

  const resetPose = useCallback(() => {
    setIkTargets(
      new Map([
        ["leftWrist", new THREE.Vector3(-0.5, 1.2, 0.3)],
        ["rightWrist", new THREE.Vector3(0.5, 1.2, 0.3)],
        ["leftAnkle", new THREE.Vector3(-0.2, 0.1, 0)],
        ["rightAnkle", new THREE.Vector3(0.2, 0.1, 0)],
        ["hips", new THREE.Vector3(0, 1, 0)],
      ]),
    );
  }, []);

  const mirrorLeftToRight = useCallback(() => {
    setIkTargets((prev) => {
      const newMap = new Map(prev);
      const leftWrist = prev.get("leftWrist");
      if (leftWrist) {
        newMap.set(
          "rightWrist",
          new THREE.Vector3(-leftWrist.x, leftWrist.y, leftWrist.z),
        );
      }
      const leftAnkle = prev.get("leftAnkle");
      if (leftAnkle) {
        newMap.set(
          "rightAnkle",
          new THREE.Vector3(-leftAnkle.x, leftAnkle.y, leftAnkle.z),
        );
      }
      return newMap;
    });
  }, []);

  return {
    ikTargets,
    selectedTarget,
    selectedBodyPart,
    partnerEnabled,
    handleTargetDrag,
    setSelectedTarget,
    setPartnerEnabled,
    saveCurrentStep,
    saveTechniqueFromSelection,
    saveAsStartingPosition,
    applyTechnique,
    resetPose,
    mirrorLeftToRight,
  };
};
```

**useSequenceViewer.ts** - Logika przeglądarki z interpolacją:

```typescript
import { useState, useCallback } from 'react';
import { useSequenceSteps } from './useSequenceSteps';
import * as THREE from 'three';

const INTERPOLATION_DURATION = 500; // ms

export const useSequenceViewer = (sequenceId: string) => {
  const { steps } = useSequenceSteps(sequenceId);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentStepData, setCurrentStepData] = useState<StepData | null>(null);
  const [isInterpolating, setIsInterpolating] = useState(false);

  const interpolateStep = useCallback((fromStep: StepData, toStep: StepData) => {
    setIsInterpolating(true);
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / INTERPOLATION_DURATION, 1);

      // Linear interpolation (lerp) between steps
      const interpolated = { /* ... lerp all positions ... */ };

      setCurrentStepData(interpolated);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsInterpolating(false);
      }
    };

    animate();
  }, []);

  const goToNextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1 && !isInterpolating) {
      interpolateStep(steps[currentStepIndex].stepData, steps[currentStepIndex + 1].stepData);
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [currentStepIndex, steps, isInterpolating, interpolateStep]);

  return {
    currentStepIndex,
    totalSteps: steps.length,
    currentStepData,
    isInterpolating,
    goToNextStep,
    goToPreviousStep: /* similar to goToNextStep */,
  };
};
```

### Faza 5: UI Screens i Nawigacja

**5.1 Struktura routing:**

```
app/threed/
├── index.tsx                    # Lista sekwencji + biblioteka technik (tabs)
├── create.tsx                   # Tworzenie nowej sekwencji
├── [sequenceId]/
│   ├── index.tsx                # Szczegóły sekwencji (lista kroków)
│   ├── edit.tsx                 # Zunifikowany edytor (landscape forced)
│   └── viewer.tsx               # Przeglądarka (dowolna orientacja)
```

**Uwaga:** Nie ma osobnych ekranów dla technik. Techniki zapisuje się i nakłada z poziomu edytora (sheet/panel). Lista technik dostępna jako tab na ekranie głównym `/threed/index.tsx`.

**5.2 Zunifikowany Edytor (edit.tsx) - Wymuszony landscape:**

Edytor obsługuje zarówno kroki sekwencji, jak i zapisywanie/nakładanie technik.
Kontekstowe akcje zależą od stanu selekcji (selectedTarget):

- **Brak selekcji:** Widoczne przyciski globalne (Save Step, Reset, Mirror, Partner, Save as Starting Position)
- **Selekcja części ciała (np. leftWrist):** Pojawia się dodatkowy przycisk "Save as Technique" + opcja "Apply Technique" (z biblioteki)
- **Biblioteka Technik:** Otwierana jako Sheet/Panel z poziomu edytora

```typescript
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import { YStack, XStack, Button } from 'tamagui';
import { ThreeDCanvas } from '@/modules/threed/components/ThreeDCanvas';
import { HumanModel } from '@/modules/threed/components/HumanModel';
import { IKTargetGizmo } from '@/modules/threed/components/IKTargetGizmo';
import { TechniqueLibrarySheet } from '@/modules/threed/components/TechniqueLibrarySheet';
import { SaveTechniqueSheet } from '@/modules/threed/components/SaveTechniqueSheet';
import { useSequenceEditor } from '@/modules/threed/hooks/useSequenceEditor';

export default function EditorScreen() {
  const { sequenceId } = useLocalSearchParams<{ sequenceId: string }>();
  const {
    ikTargets,
    selectedTarget,
    selectedBodyPart,    // resolved body part from selected target
    partnerEnabled,
    handleTargetDrag,
    setSelectedTarget,
    setPartnerEnabled,
    saveCurrentStep,
    saveTechniqueFromSelection,  // saves partial technique from selected body part
    saveAsStartingPosition,      // saves fullbody technique
    applyTechnique,              // applies technique (masking or fullbody)
    resetPose,
    mirrorLeftToRight,
  } = useSequenceEditor(sequenceId);

  const [showTechniqueLibrary, setShowTechniqueLibrary] = useState(false);
  const [showSaveTechnique, setShowSaveTechnique] = useState(false);

  // Force landscape orientation
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  return (
    <YStack flex={1}>
      {/* 3D Canvas - 70% */}
      <YStack flex={7}>
        <ThreeDCanvas cameraControls="fixed">
          <HumanModel modelSlot={0} ikTargets={ikTargets} />

          {partnerEnabled && (
            <HumanModel modelSlot={1} color="#ff0000" ikTargets={new Map()} />
          )}

          {Array.from(ikTargets.entries()).map(([name, position]) => (
            <IKTargetGizmo
              key={name}
              targetName={name}
              position={position}
              isSelected={selectedTarget === name}
              onDrag={handleTargetDrag}
              onSelect={setSelectedTarget}
            />
          ))}
        </ThreeDCanvas>
      </YStack>

      {/* Controls - 30% */}
      <XStack flex={3} padding="$2" gap="$2" backgroundColor="$background">
        {/* Global actions (always visible) */}
        <Button onPress={() => setPartnerEnabled(!partnerEnabled)}>
          {t(partnerEnabled ? 'threedRemovePartner' : 'threedAddPartner')}
        </Button>
        <Button onPress={mirrorLeftToRight}>{t('threedMirror')}</Button>
        <Button onPress={resetPose}>{t('threedReset')}</Button>
        <Button onPress={saveCurrentStep}>{t('threedSaveStep')}</Button>

        {/* Contextual: when a body part is selected */}
        {selectedBodyPart && (
          <Button onPress={() => setShowSaveTechnique(true)}>
            {t('threedSaveTechnique')}
          </Button>
        )}

        {/* Save fullbody as starting position (no selection required) */}
        <Button onPress={saveAsStartingPosition}>
          {t('threedSaveStartingPosition')}
        </Button>

        {/* Open technique library to apply */}
        <Button onPress={() => setShowTechniqueLibrary(true)}>
          {t('threedTechniques')}
        </Button>
      </XStack>

      {/* Technique Library Sheet */}
      <TechniqueLibrarySheet
        isOpen={showTechniqueLibrary}
        onClose={() => setShowTechniqueLibrary(false)}
        onSelect={(technique) => {
          applyTechnique(technique);
          setShowTechniqueLibrary(false);
        }}
        filterBodyPart={selectedBodyPart} // filters by selected part, or shows all if null
      />

      {/* Save Technique Sheet (title, tag input) */}
      <SaveTechniqueSheet
        isOpen={showSaveTechnique}
        onClose={() => setShowSaveTechnique(false)}
        bodyPart={selectedBodyPart}
        onSave={(title, tag) => {
          saveTechniqueFromSelection(title, tag);
          setShowSaveTechnique(false);
        }}
      />
    </YStack>
  );
}
```

**5.3 Przeglądarka (viewer.tsx) - Dowolna orientacja:**

```typescript
export default function ViewerScreen() {
  const { sequenceId } = useLocalSearchParams<{ sequenceId: string }>();
  const {
    currentStepIndex,
    totalSteps,
    currentStepData,
    isInterpolating,
    goToNextStep,
    goToPreviousStep,
  } = useSequenceViewer(sequenceId);

  return (
    <YStack flex={1}>
      <YStack flex={1}>
        <ThreeDCanvas cameraControls="orbit">
          <HumanModel
            modelSlot={0}
            ikTargets={currentStepData?.mainActor.targets || new Map()}
          />

          {currentStepData?.partner && (
            <HumanModel
              modelSlot={1}
              color={currentStepData.partner.color}
              ikTargets={currentStepData.partner.targets}
            />
          )}
        </ThreeDCanvas>
      </YStack>

      <XStack padding="$4" gap="$2" justifyContent="center">
        <Button
          onPress={goToPreviousStep}
          disabled={currentStepIndex === 0 || isInterpolating}
        >
          {t('commonPrevious')}
        </Button>

        <Button disabled>{`${currentStepIndex + 1} / ${totalSteps}`}</Button>

        <Button
          onPress={goToNextStep}
          disabled={currentStepIndex === totalSteps - 1 || isInterpolating}
        >
          {t('commonNext')}
        </Button>
      </XStack>
    </YStack>
  );
}
```

**5.4 Ekran główny z tabami (index.tsx) - Sekwencje + Biblioteka Technik:**

```typescript
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { YStack, XStack, Button, ScrollView, Tabs } from 'tamagui';
import { useSequences } from '@/modules/threed/hooks/useSequences';
import { useTechniques } from '@/modules/threed/hooks/useTechniques';
import { SequenceCard } from '@/modules/threed/components/SequenceCard';
import { TechniqueCard } from '@/modules/threed/components/TechniqueCard';
import { BODY_PART } from '@/modules/threed/types/dto';

export default function ThreeDScreen() {
  const router = useRouter();
  const { sequences, isLoading: seqLoading } = useSequences();
  const { techniques, isLoading: techLoading } = useTechniques();

  // Filtrowanie technik
  const startingPositions = techniques.filter(t => t.bodyPart === BODY_PART.FULLBODY);
  const partialTechniques = techniques.filter(t => t.bodyPart !== BODY_PART.FULLBODY);

  return (
    <YStack flex={1} padding="$4">
      <Tabs defaultValue="sequences">
        <Tabs.List>
          <Tabs.Tab value="sequences">{t('threedSequences')}</Tabs.Tab>
          <Tabs.Tab value="techniques">{t('threedTechniques')}</Tabs.Tab>
          <Tabs.Tab value="positions">{t('threedStartingPositions')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Content value="sequences">
          <Button onPress={() => router.push('/threed/create')}>
            {t('threedCreateSequence')}
          </Button>
          <ScrollView>
            {sequences.map((sequence) => (
              <SequenceCard
                key={sequence.id}
                sequence={sequence}
                onPress={() => router.push(`/threed/${sequence.id}`)}
              />
            ))}
          </ScrollView>
        </Tabs.Content>

        <Tabs.Content value="techniques">
          <ScrollView>
            {partialTechniques.map((technique) => (
              <TechniqueCard key={technique.id} technique={technique} />
            ))}
          </ScrollView>
        </Tabs.Content>

        <Tabs.Content value="positions">
          <ScrollView>
            {startingPositions.map((technique) => (
              <TechniqueCard key={technique.id} technique={technique} isStartingPosition />
            ))}
          </ScrollView>
        </Tabs.Content>
      </Tabs>
    </YStack>
  );
}
```

**5.5 Nawigacja z dashboard:**

W `app/user/dashboard.tsx` dodać przycisk:

```typescript
<Button onPress={() => router.push('/threed')}>
  {t('techniquesNotebook')}
</Button>
```

### Faza 6: Integracja i Finalizacja

**6.1 Supabase Storage Bucket:**

Utworzyć migrację `supabase/migrations/20260214000000_create_3d_sequences_bucket.sql`:

```sql
-- Create storage bucket for 3D sequence cover images
insert into storage.buckets (id, name, public)
values ('3d-sequences', '3d-sequences', true);

-- RLS Policy: Users can upload their own screenshots
create policy "Users can upload 3D sequence images"
  on storage.objects for insert
  using (
    bucket_id = '3d-sequences'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS Policy: Anyone can view
create policy "Anyone can view 3D sequence images"
  on storage.objects for select
  using (bucket_id = '3d-sequences');
```

**6.2 Instalacja react-native-view-shot:**

```bash
npm install react-native-view-shot@^3.8.0
```

**6.3 Internationalization:**

Dodać do `src/core/i18n/locales/en.json` (i `pl.json`):

```json
{
  "techniquesNotebook": "3D Technique Notebook",
  "threedSequences": "Sequences",
  "threedCreateSequence": "Create New Sequence",
  "threedSaveStep": "Save Step",
  "threedAddPartner": "Add Partner",
  "threedRemovePartner": "Remove Partner",
  "threedMirror": "Mirror Left to Right",
  "threedReset": "Reset Pose",
  "threedSaveTechnique": "Save as Technique",
  "threedSaveStartingPosition": "Save as Starting Position",
  "threedTechniques": "Technique Library",
  "threedStartingPositions": "Starting Positions",
  "threedApplyTechnique": "Apply Technique",
  "threedHandPresets": "Hand Presets",
  "threedSelectHandPreset": "Select Hand Shape",
  "threedCoverImageSelect": "Select Cover Image",
  "threedErrorNoUser": "User not authenticated",
  "threedPresetFist": "Fist",
  "threedPresetOpenHand": "Open Hand",
  "threedPresetGrip": "Grip",
  "threedPresetKnifeHand": "Knife Hand",
  "threedPresetPoint": "Point",
  "threedFullbody": "Full Body",
  "threedPartial": "Partial"
}
```

Polskie tłumaczenia:

```json
{
  "techniquesNotebook": "Notatnik Technik 3D",
  "threedSequences": "Sekwencje",
  "threedCreateSequence": "Utwórz Nową Sekwencję",
  "threedSaveStep": "Zapisz Krok",
  "threedAddPartner": "Dodaj Partnera",
  "threedRemovePartner": "Usuń Partnera",
  "threedMirror": "Odbij Lustrzanie",
  "threedReset": "Resetuj Pozę",
  "threedSaveTechnique": "Zapisz jako Technikę",
  "threedSaveStartingPosition": "Zapisz Pozycję Startową",
  "threedTechniques": "Biblioteka Technik",
  "threedStartingPositions": "Pozycje Startowe",
  "threedApplyTechnique": "Nałóż Technikę",
  "threedHandPresets": "Ustawienia Dłoni",
  "threedSelectHandPreset": "Wybierz Kształt Dłoni",
  "threedCoverImageSelect": "Wybierz Okładkę",
  "threedErrorNoUser": "Użytkownik nie zalogowany",
  "threedPresetFist": "Pięść",
  "threedPresetOpenHand": "Otwarta Dłoń",
  "threedPresetGrip": "Chwyt",
  "threedPresetKnifeHand": "Cięcie",
  "threedPresetPoint": "Wskazujący",
  "threedFullbody": "Całe Ciało",
  "threedPartial": "Częściowa"
}
```

**6.4 Seed Data - Body Pose Presets:**

Utworzyć migrację `supabase/migrations/20260214100000_seed_hand_presets.sql`:

```sql
-- Seed hand presets (system-provided)
insert into public.body_pose_presets (id, name, body_part_type, data, is_system)
values
  (
    gen_random_uuid(),
    'Fist',
    'hand',
    '{"bones": {"LeftFinger1": {"rotation": {"x": 0, "y": 0, "z": 1.2, "w": 0.8}}}}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'Open Hand',
    'hand',
    '{"bones": {"LeftFinger1": {"rotation": {"x": 0, "y": 0, "z": 0, "w": 1}}}}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'Grip',
    'hand',
    '{"bones": {"LeftFinger1": {"rotation": {"x": 0, "y": 0, "z": 0.8, "w": 0.9}}}}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'Knife Hand',
    'hand',
    '{"bones": {"LeftFinger1": {"rotation": {"x": 0, "y": 0, "z": 0, "w": 1}}}}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'Point',
    'hand',
    '{"bones": {"LeftFinger1": {"rotation": {"x": 0, "y": 0, "z": 0, "w": 1}}}}'::jsonb,
    true
  );
```

**UWAGA:** Dane rotacji bone są placeholder - muszą być dopasowane do faktycznej struktury `human.glb` po inspekcji modelu.

## Critical Files to Modify/Create

### Nowe pliki do utworzenia

**Database Schema & Models:**

1. `src/modules/threed/database/schema.ts` - Definicje 5 tabel WatermelonDB
2. `src/database/models/BodyPosePreset.ts` - Model WatermelonDB
3. `src/database/models/Technique.ts` - Model WatermelonDB
4. `src/database/models/Sequence.ts` - Model WatermelonDB
5. `src/database/models/SequenceStep.ts` - Model WatermelonDB
6. `src/database/models/StepTechnique.ts` - Model WatermelonDB

**Repositories (6 files):** 7. `src/modules/threed/repositories/bodyPosePresetRepository.ts` 8. `src/modules/threed/repositories/techniqueRepository.ts` 9. `src/modules/threed/repositories/sequenceRepository.ts` 10. `src/modules/threed/repositories/sequenceStepRepository.ts` 11. `src/modules/threed/repositories/stepTechniqueRepository.ts` 12. `src/modules/threed/repositories/index.ts`

**Services (4 files):** 13. `src/modules/threed/services/sequenceService.ts` 14. `src/modules/threed/services/techniqueService.ts` 15. `src/modules/threed/services/screenshotService.ts` 16. `src/modules/threed/services/index.ts`

**IK System:** 17. `src/modules/threed/utils/ikSystem.ts` - IK Solver manager (CCDIKSolver)

**3D Components (8 files):** 18. `src/modules/threed/components/ThreeDCanvas.tsx` 19. `src/modules/threed/components/HumanModel.tsx` 20. `src/modules/threed/components/IKTargetGizmo.tsx` 21. `src/modules/threed/components/HandPresetPicker.tsx` 22. `src/modules/threed/components/SequenceCard.tsx` 23. `src/modules/threed/components/TechniqueCard.tsx` 24. `src/modules/threed/components/TechniqueLibrarySheet.tsx` - Sheet do przeglądania/nakładania technik w edytorze 25. `src/modules/threed/components/SaveTechniqueSheet.tsx` - Sheet do zapisywania techniki (tytuł, tag)

**Hooks (5 files):** 26. `src/modules/threed/hooks/useSequences.ts` 27. `src/modules/threed/hooks/useSequenceEditor.ts` - zunifikowany hook (sekwencje + techniki) 28. `src/modules/threed/hooks/useSequenceViewer.ts` 29. `src/modules/threed/hooks/useHandPresets.ts` 30. `src/modules/threed/hooks/useTechniques.ts` - lista technik użytkownika (z filtrowaniem fullbody vs partial)

**Types:** 31. `src/modules/threed/types/dto.ts` - DTOs, interfaces, BODY_PART const + BodyPart type, BODY_PART_TARGETS mapping

**UI Screens (5 files):** 32. `app/threed/index.tsx` - Ekran główny z tabami (Sekwencje / Biblioteka Technik / Pozycje Startowe) 33. `app/threed/create.tsx` - Tworzenie sekwencji 34. `app/threed/[sequenceId]/index.tsx` - Szczegóły sekwencji 35. `app/threed/[sequenceId]/edit.tsx` - Zunifikowany edytor (sekwencje + techniki) 36. `app/threed/[sequenceId]/viewer.tsx` - Przeglądarka

**Migrations:** 34. `supabase/migrations/20260214000000_create_3d_sequences_bucket.sql` 35. `supabase/migrations/20260214100000_seed_hand_presets.sql`

### Pliki do modyfikacji

1. `src/database/schema.ts` - Dodać import i threedSchema, zwiększyć version: 9
2. `src/database/models/index.ts` - Eksportować 5 nowych modeli
3. `src/core/i18n/locales/en.json` - Dodać tłumaczenia
4. `src/core/i18n/locales/pl.json` - Dodać tłumaczenia polskie
5. `app/user/dashboard.tsx` - Dodać przycisk nawigacji do modułu 3D
6. `package.json` - Dodać `react-native-view-shot@^3.8.0` (przez npm install)

## Verification

### 1. Schema Verification

```bash
# Check WatermelonDB schema compiles
npm run typecheck

# Check Supabase migrations
cd supabase
supabase db reset --local
```

### 2. Manual Testing Checklist

**Phase 1 - Data Layer:**

- [ ] Schema WatermelonDB kompiluje się bez błędów
- [ ] Modele eksportują się z `src/database/models/index.ts`
- [ ] Repozytoria: create() tworzy rekord z UUID
- [ ] Repozytoria: findByUserId() zwraca wyniki
- [ ] Repozytoria: observeByUserId() emituje zmiany reaktywnie
- [ ] Serwisy: createSequence() wywołuje sync()

**Phase 2 - 3D Components:**

- [ ] ThreeDCanvas renderuje się na iOS i Android
- [ ] HumanModel ładuje human.glb poprawnie
- [ ] Model wyświetla się z odpowiednim kolorem
- [ ] IKTargetGizmo renderuje się w przestrzeni 3D
- [ ] Gizmo reaguje na touch/drag events

**Phase 3 - IK System:**

- [ ] IKSystemManager inicjalizuje się bez błędów
- [ ] setTargetPosition() przesuwa target
- [ ] update() solver działa (kończyny poruszają się)
- [ ] Constraints działają (kolano nie gnie się do przodu)
- [ ] Performance: 60 FPS podczas drag operacji

**Phase 4 - Zunifikowany Editor:**

- [ ] Editor wymusza orientację landscape
- [ ] Dragging IK target aktualizuje model
- [ ] Reset przywraca neutral pose
- [ ] Mirror kopiuje pozycję z lewej na prawą
- [ ] Partner model renderuje się w czerwonym kolorze
- [ ] SaveStep zapisuje snapshot do bazy danych
- [ ] Selekcja kończyny wyświetla przycisk "Zapisz jako Technikę"
- [ ] Zapisanie techniki częściowej (partial) tworzy rekord z body_part = zaznaczona część
- [ ] "Zapisz Pozycję Startową" tworzy rekord z body_part = fullbody
- [ ] Biblioteka Technik otwiera się jako Sheet i filtruje po zaznaczonej części ciała
- [ ] Nałożenie techniki częściowej nadpisuje tylko powiązane targety (masking)
- [ ] Nałożenie techniki fullbody nadpisuje wszystkie targety

**Phase 5 - Viewer:**

- [ ] Lista kroków wyświetla się w kolejności (order_index)
- [ ] Next/Previous buttons zmieniają krok
- [ ] Interpolacja działa płynnie (500ms)
- [ ] OrbitControls pozwala na rotację kamery
- [ ] Viewer działa w dowolnej orientacji

**Phase 6 - Integration:**

- [ ] Screenshot capture działa (react-native-view-shot)
- [ ] Upload do Supabase Storage 3d-sequences bucket
- [ ] Cover image URL zapisuje się w sequences.cover_image_url
- [ ] Offline sync: Tworzenie sekwencji offline → sync po połączeniu
- [ ] Tłumaczenia wyświetlają się poprawnie (PL/EN)

### 3. Performance Testing

**Target: 60 FPS na 3-letnim smartfonie**

Test na:

- iPhone 12 (iOS)
- Samsung Galaxy S21 (Android)

Profiling:

```typescript
// W useFrame hook
const fps = 1000 / deltaMs;
if (fps < 55) {
  console.warn("[Performance] FPS drop:", fps);
}
```

**Optymalizacje jeśli FPS < 60:**

- Zmniejszyć iteracje IK solver (10 → 5)
- Uprostić geometrię modelu
- Dodać throttling do drag events
- Użyć memoization dla materiałów

### 4. End-to-End Test Scenario

**Scenariusz użytkownika A - Sekwencja z technikami:**

1. Użytkownik otwiera aplikację offline
2. Nawiguje do /threed → "Create New Sequence"
3. Wprowadza tytuł "Front Kick Sequence"
4. Przechodzi do edytora (edit.tsx)
5. Ustawia pozę startową (bojowa pozycja) → kliknij "Zapisz Pozycję Startową" → tytuł "Bojowa"
6. Kliknij "Save Step" (zapisuje krok 1)
7. Przeciąga leftAnkle do góry (symulacja kopnięcia)
8. Zaznacza leftAnkle → kliknij "Zapisz jako Technikę" → tytuł "Front Kick", tag "Atak"
9. Kliknij "Save Step" (zapisuje krok 2)
10. Reset pose
11. Otwiera "Biblioteka Technik" → nakłada pozycję startową "Bojowa" (fullbody override)
12. Kliknij "Save Step" (zapisuje krok 3 - powrót do pozycji startowej)
13. Wyjście z edytora → Przejście do viewer.tsx
14. Kliknij "Next" → interpolacja działa
15. Wybór cover image → Screenshot → upload → URL zapisany
16. Połączenie z internetem → sync automatyczny

**Scenariusz użytkownika B - Wielokrotne użycie pozycji startowej:**

1. Użytkownik tworzy nową sekwencję "Roundhouse Combo"
2. W edytorze otwiera Bibliotekę Technik → nakłada zapisaną wcześniej "Bojowa" (fullbody)
3. Kliknij "Save Step" → pozycja startowa taka sama jak w sekwencji A
4. Ustawia kopnięcie okrężne → Save Step
5. Weryfikacja: pozycja startowa jest współdzielona między sekwencjami (reuse technik)

**Expected:** Wszystkie kroki działają bez błędów, techniki i pozycje startowe są zapisywane do biblioteki i mogą być wielokrotnie nakładane na różne sekwencje.

## Risks & Mitigations

### Risk 1: Model GLB bone structure niekompatybilna

**Impact:** IK system nie będzie działać
**Mitigation:**

- Inspekcja character.glb używając Three.js Inspector (<https://threejs.org/editor/>)
- Utworzenie bone mapping layer jeśli nazwy różnią się
- W najgorszym przypadku: pobrać nowy model z Mixamo z znaną strukturą bone

### Risk 2: Performance drops poniżej 60 FPS

**Impact:** Słabe UX, aplikacja "laguje"
**Mitigation:**

- Profile używając React DevTools Profiler
- Optymalizacje: mniej iteracji IK, throttling drag events
- Dodać ustawienia jakości (quality settings)

### Risk 3: react-native-view-shot nie działa na iOS simulator

**Impact:** Screenshot nie będzie działać w development
**Mitigation:**

- Testować na fizycznym urządzeniu
- Alternatywa: expo-gl snapshot (głębsza integracja)

### Risk 4: Supabase Storage quota przekroczony

**Impact:** Użytkownicy nie mogą uploadować cover images
**Mitigation:**

- Limit rozmiaru zdjęcia: max 1MB
- Kompresja jakości: 0.8 (80%)
- Monitoring storage usage w Supabase dashboard

## Architecture Decisions

### 1. JSON in JSONB vs Separate Columns

**Decision:** Używać JSONB `data` dla pose snapshots
**Rationale:**

- Flexible schema (IK targets mogą ewoluować)
- Atomic updates (cały snapshot jest wersjonowany)
- Uproszczona logika synchronizacji
- Zgodny z istniejącą migracją Supabase

### 2. CCDIKSolver vs Custom IK Implementation

**Decision:** Używać three-stdlib CCDIKSolver
**Rationale:**

- Już zainstalowany, battle-tested
- CCD algorithm jest wystarczająco szybki dla real-time (< 5ms)
- Wspiera constraints out-of-the-box
- Community support i dokumentacja

### 3. React Three Fiber vs expo-three

**Decision:** Używać R3F dla komponentów 3D
**Rationale:**

- Deklaratywne wzorce React (łatwiejsze zarządzanie stanem)
- Lepsza integracja z Zustand
- AnimatedBackground używa expo-three (prosty przypadek), ale editor wymaga złożonej interakcji
- R3F lepiej obsługuje pointer events

### 4. Separate step_techniques Table

**Decision:** Zachować junction table mimo JSON w steps
**Rationale:**

- Umożliwia workflow: technique library → step masking
- Pozwala na queries "które kroki używają tej techniki"
- Future-proof dla zaawansowanych funkcji (wersjonowanie technik)

## Summary

Implementacja modułu 3D wymaga utworzenia **~43 plików** (38 nowych + 5 modyfikacji) zorganizowanych w modułowej architekturze zgodnej z istniejącymi wzorcami Evolync. Kluczowe komponenty to:

1. **Data Layer**: WatermelonDB schema + 5 modeli + repozytoria + serwisy
2. **3D Engine**: IK System (CCDIKSolver) + React Three Fiber komponenty
3. **UI Layer**: Hooki + 5 ekranów (zunifikowany editor landscape, viewer dowolna orientacja)
4. **Integration**: Supabase Storage bucket + i18n + nawigacja

**Kluczowe decyzje architektoniczne (zaktualizowane):**

- **Zunifikowany edytor:** Jeden ekran edytora obsługuje zarówno kroki sekwencji, jak i zapisywanie/nakładanie technik. Brak osobnych ekranów dla technik.
- **Pozycje startowe jako techniki fullbody:** `body_part = 'fullbody'` w tabeli `techniques` przechowuje pełny snapshot pozy. Masking = nadpisanie wszystkich targetów.
- **Kontekstowe UI:** Akcje w edytorze zależą od stanu selekcji (zaznaczona kończyna → "Zapisz jako Technikę", brak selekcji → "Zapisz Pozycję Startową").
- **Ekran główny z tabami:** `/threed/index.tsx` ma 3 taby: Sekwencje, Biblioteka Technik, Pozycje Startowe.

**Offline-first** jest zachowany przez wzorzec repository.observe() + sync() triggers. **Performance target 60 FPS** będzie wymagać testowania na fizycznych urządzeniach i potencjalnych optymalizacji IK iterations.

Implementacja powinna rozpocząć się od **Fazy 1** (Schema + Modele), następnie **Faza 2** (Repozytoria + Serwisy), potem **Faza 3** (IK System), **Faza 4** (Komponenty 3D + Hooki), i finalnie **Faza 5-6** (UI Screens + Integracja).
