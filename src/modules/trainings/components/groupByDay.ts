import type Training from "@/database/models/Training";
import { timestampToDay } from "../types/helpers";

export interface TrainingDaySection {
  day: string; // "YYYY-MM-DD"
  data: Training[];
}

/** Groups day/time-sorted trainings into one section per day, in order. */
export const groupTrainingsByDay = (trainings: Training[]): TrainingDaySection[] => {
  const sections: TrainingDaySection[] = [];
  for (const training of trainings) {
    const day = timestampToDay(training.date);
    const last = sections.at(-1);
    if (last && last.day === day) last.data.push(training);
    else sections.push({ day, data: [training] });
  }
  return sections;
};

/** Active trainings within [fromDay, fromDay + days) — the dashboard badge. */
export const countActiveWithinDays = (trainings: Training[], fromDay: string, days: number): number => {
  const start = Date.parse(`${fromDay}T00:00:00Z`);
  const end = start + days * 24 * 60 * 60 * 1000;
  return trainings.filter((t) => {
    const ts = t.date.getTime();
    return t.status === "active" && ts >= start && ts < end;
  }).length;
};
