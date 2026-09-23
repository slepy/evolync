import {
  SequencesTab,
  StartingPositionsTab,
  TechniquesTab,
} from "@/modules/threed/components";
import { THREED_TAB, type ThreeDTab } from "@/modules/threed/types";
import { Lightbulb, Sparkles, Zap } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { useSequences } from "./useSequences";
import { useTechniques } from "./useTechniques";
import { useStartingPositions } from "./useStartingPositions";

export const useThreeDScreen = () => {
  const [activeTab, setActiveTab] = useState<THREED_TAB>(THREED_TAB.SEQUENCES);

  const { sequences, isLoading: seqLoading } = useSequences();
  const { techniques, isLoading: techLoading } = useTechniques();
  const { positions: startingPositions, isLoading: posLoading } = useStartingPositions();

  const tabs: ThreeDTab[] = useMemo(
    () => [
      { value: THREED_TAB.SEQUENCES, label: t("threedSequences"), icon: Zap },
      { value: THREED_TAB.TECHNIQUES, label: t("threedTechniques"), icon: Sparkles },
      { value: THREED_TAB.POSITIONS, label: t("threedStartingPositions"), icon: Lightbulb },
    ],
    []
  );

  const tabContent = useMemo(
    () => ({
      [THREED_TAB.SEQUENCES]: React.createElement(SequencesTab, { sequences }),
      [THREED_TAB.TECHNIQUES]: React.createElement(TechniquesTab, { techniques }),
      [THREED_TAB.POSITIONS]: React.createElement(StartingPositionsTab, { positions: startingPositions }),
    }),
    [sequences, techniques, startingPositions]
  );

  return {
    activeTab,
    setActiveTab,
    tabs,
    tabContent,
    isLoading: seqLoading || techLoading || posLoading,
  };
};
