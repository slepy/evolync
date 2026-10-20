import { moduleAccents } from "@/core/theme/tokens";

export const EVENT = moduleAccents.events;

export const TRAINING = moduleAccents.trainings;

/** Bar color per lane: events gradient start, then its end. */
export const LANE_COLORS = [EVENT.from, EVENT.to];
