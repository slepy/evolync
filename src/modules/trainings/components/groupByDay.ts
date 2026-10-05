import type Training from "@/database/models/Training";

/** Active trainings within [fromDay, fromDay + days) — the dashboard badge. */
export const countActiveWithinDays = (trainings: Training[], fromDay: string, days: number): number => {
  const start = Date.parse(`${fromDay}T00:00:00Z`);
  const end = start + days * 24 * 60 * 60 * 1000;
  return trainings.filter((t) => {
    const ts = t.date.getTime();
    return t.status === "active" && ts >= start && ts < end;
  }).length;
};
