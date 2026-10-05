export type DateTimeFieldMode = "date" | "time";

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" / "HH:mm" → the local Date the system pickers work with. */
export function toPickerDate(mode: DateTimeFieldMode, value: string): Date {
  if (mode === "date") {
    const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : new Date();
  }
  const time = /^(\d{1,2}):(\d{2})$/.exec(value);
  const date = new Date();
  date.setHours(time ? Number(time[1]) : 18, time ? Number(time[2]) : 0, 0, 0);
  return date;
}

/** Local Date from a picker → "YYYY-MM-DD" / "HH:mm". */
export function fromPickerDate(mode: DateTimeFieldMode, date: Date): string {
  return mode === "date"
    ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    : `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
