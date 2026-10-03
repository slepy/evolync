import type Training from "@/database/models/Training";
import { useMemo } from "react";
import { countActiveWithinDays } from "../components/groupByDay";
import { DASHBOARD_BADGE_DAYS } from "../types/enums";
import { localToday } from "../types/helpers";

/** Dashboard badge: active trainings in the next 7 days (today included). */
export const useTrainingsBadge = (trainings: Training[]): number =>
  useMemo(() => countActiveWithinDays(trainings, localToday(), DASHBOARD_BADGE_DAYS), [trainings]);
