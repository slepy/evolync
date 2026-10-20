import {
  ChipFilter,
  EmptyState,
  IconTabs,
  ListCard,
  ListEmpty,
  ListIcon,
  ListRow,
  ListSection,
  SearchField,
  SubScreenPage,
  TagChip,
} from "@/core/components";
import { LoadingScreen } from "@/core/components";
import { useRouter } from "expo-router";
import { Box, Flag, Layers, WandSparkles } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Text } from "tamagui";
import { useSequenceList, useStartingPositions, useTechniques } from "../hooks";
import {
  BODY_PART_FILTER_KEYS,
  BODY_PART_FILTERS,
  bodyPartLabelKey,
  filterSequences,
  filterTechniques,
  formatThreeDDate,
  type BodyPartFilter,
  type TechniqueListItem,
} from "../library";
import { THREED_TAB } from "../types";

const bodyPartLabel = (bodyPart: string) => t(bodyPartLabelKey(bodyPart));

const toItems = (records: Array<{ id: string; title: string; bodyPart: string; createdAt: Date }>): TechniqueListItem[] =>
  records.map(({ id, title, bodyPart, createdAt }) => ({ id, title, bodyPart, createdAt }));

/**
 * 3D library (D2 / D3 / D4): Sequences, Techniques and Positions tabs in 3D
 * lime. Sequences: search, "Your sequences" with Add new, steps · date and
 * tags per row (D2E: the empty library). Techniques: search, body-part chips,
 * body part · date. Positions: the full-body poses.
 */
export function ThreeDLibraryScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<THREED_TAB>(THREED_TAB.SEQUENCES);
  const { sequences, isLoading: sequencesLoading } = useSequenceList();
  const { techniques, isLoading: techniquesLoading } = useTechniques();
  const { positions, isLoading: positionsLoading } = useStartingPositions();
  const [sequenceQuery, setSequenceQuery] = useState("");
  const [techniqueQuery, setTechniqueQuery] = useState("");
  const [bodyPart, setBodyPart] = useState<BodyPartFilter>("all");

  const visibleSequences = useMemo(() => filterSequences(sequences, sequenceQuery), [sequences, sequenceQuery]);
  const visibleTechniques = useMemo(
    () => filterTechniques(toItems(techniques), techniqueQuery, bodyPart, bodyPartLabel),
    [techniques, techniqueQuery, bodyPart],
  );
  const openCreate = () => router.push("/techniques/threed/create" as any);
  const openTechnique = (id: string) => router.push(`/techniques/threed/technique/${id}` as any);
  const subtitle = (bodyPartValue: string, createdAt: Date) =>
    `${bodyPartLabel(bodyPartValue)} · ${formatThreeDDate(createdAt, t("locale"))}`;

  if (sequencesLoading || techniquesLoading || positionsLoading) return <LoadingScreen />;

  return (
    <SubScreenPage title={t("techniquesModeThreeD")}>
      <IconTabs
        aria-label={t("threedLibrary")}
        active={tab}
        onChange={setTab}
        tabs={[
          { key: THREED_TAB.SEQUENCES, icon: Layers, label: t("threedSequences"), accent: "threed" },
          { key: THREED_TAB.TECHNIQUES, icon: WandSparkles, label: t("threedTechniques"), accent: "threed" },
          { key: THREED_TAB.POSITIONS, icon: Flag, label: t("threedPositions"), accent: "threed" },
        ]}
      />

      {tab === THREED_TAB.SEQUENCES ? (
        sequences.length === 0 ? (
          <EmptyState
            icon={Box}
            accent="threed"
            title={t("threedNoSequences")}
            text={t("threedNoSequencesHint")}
            action={{ label: t("addNew"), onPress: openCreate }}
          />
        ) : (
          <>
            <SearchField
              value={sequenceQuery}
              onChangeText={setSequenceQuery}
              placeholder={t("threedSearchSequences")}
              accent="threed"
            />
            <ListSection
              title={t("threedYourSequences")}
              accent="threed"
              action={{ label: t("addNew"), onPress: openCreate }}
            >
              {visibleSequences.length > 0 ? (
                <ListCard aria-label={t("threedYourSequences")}>
                  {visibleSequences.map((sequence) => (
                    <ListRow
                      key={sequence.id}
                      title={sequence.title}
                      subtitle={`${t("threedStepCount", { count: sequence.stepCount })} · ${formatThreeDDate(sequence.createdAt, t("locale"))}`}
                      leading={<ListIcon icon={Layers} accent="threed" />}
                      meta={
                        sequence.tags.length > 0
                          ? sequence.tags.map((tag) => <TagChip key={tag.id} label={tag.name} />)
                          : undefined
                      }
                      onPress={() => router.push(`/techniques/threed/${sequence.id}` as any)}
                    />
                  ))}
                </ListCard>
              ) : (
                <ListEmpty text={t("threedNoMatch")} hint={t("threedNoMatchHint")} />
              )}
            </ListSection>
          </>
        )
      ) : null}

      {tab === THREED_TAB.TECHNIQUES ? (
        techniques.length === 0 ? (
          <EmptyState icon={WandSparkles} accent="threed" title={t("threedNoTechniques")} text={t("threedTechniquesHint")} />
        ) : (
          <>
            <SearchField
              value={techniqueQuery}
              onChangeText={setTechniqueQuery}
              placeholder={t("threedSearchTechniques")}
              accent="threed"
            />
            <ChipFilter
              aria-label={t("threedFilterBodyPart")}
              accent="threed"
              value={bodyPart}
              onChange={setBodyPart}
              options={BODY_PART_FILTERS.map((value) => ({ value, label: t(BODY_PART_FILTER_KEYS[value]) }))}
            />
            <ListSection title={t("threedYourTechniques")} accent="threed">
              {visibleTechniques.length > 0 ? (
                <ListCard aria-label={t("threedYourTechniques")}>
                  {visibleTechniques.map((technique) => (
                    <ListRow
                      key={technique.id}
                      title={technique.title}
                      subtitle={subtitle(technique.bodyPart, technique.createdAt)}
                      leading={<ListIcon icon={WandSparkles} accent="threed" />}
                      onPress={() => openTechnique(technique.id)}
                    />
                  ))}
                </ListCard>
              ) : (
                <ListEmpty text={t("threedNoMatch")} hint={t("threedNoMatchHint")} />
              )}
            </ListSection>
            <Hint text={t("threedTechniquesHint")} />
          </>
        )
      ) : null}

      {tab === THREED_TAB.POSITIONS ? (
        positions.length === 0 ? (
          <EmptyState icon={Flag} accent="threed" title={t("threedNoPositions")} text={t("threedPositionsHint")} />
        ) : (
          <>
            <ListSection title={t("threedStartingPositions")} accent="threed">
              <ListCard aria-label={t("threedStartingPositions")}>
                {positions.map((position) => (
                  <ListRow
                    key={position.id}
                    title={position.title}
                    subtitle={subtitle(position.bodyPart, position.createdAt)}
                    leading={<ListIcon icon={Flag} accent="threed" />}
                    onPress={() => openTechnique(position.id)}
                  />
                ))}
              </ListCard>
            </ListSection>
            <Hint text={t("threedPositionsHint")} />
          </>
        )
      ) : null}
    </SubScreenPage>
  );
}

interface HintProps {
  text: string;
}

/** Muted centered line under a list (D3, D4). */
function Hint({ text }: HintProps) {
  return (
    <Text fontSize="$secondary" fontWeight="$secondary" color="$neutralMuted" textAlign="center" marginTop={-8}>
      {text}
    </Text>
  );
}
