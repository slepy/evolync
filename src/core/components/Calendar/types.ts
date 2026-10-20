import { type ListAccent } from "../List/accent";

export interface CalendarRow {
  key: string;
  kind: "event" | "training";
  title: string;
  /** "18:00–19:30 · Warszawa Mokotów", "20 Nov – 24 Nov · Zakopane". */
  meta: string;
  /** "Day 2/5", "↻ Weekly", "Cancelled". */
  badge?: { label: string; accent: ListAccent };
  cancelled?: boolean;
  onPress?: () => void;
}
