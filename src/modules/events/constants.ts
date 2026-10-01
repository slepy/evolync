import { Check, Clock, X, type LucideIcon } from "lucide-react-native";
import type { ColorTokens } from "tamagui";
import {
  type EventParticipantStatus,
  EVENT_PARTICIPANT_STATUS,
} from "@/database/models/EventParticipant";

/**
 * Status cycle for participant status toggle
 * Instructors cycle through all statuses: absent -> attending -> paid -> absent
 */
export const PARTICIPANT_STATUS_CYCLE: EventParticipantStatus[] = [
  EVENT_PARTICIPANT_STATUS.ABSENT,
  EVENT_PARTICIPANT_STATUS.ATTENDING,
  EVENT_PARTICIPANT_STATUS.PAID,
];

/**
 * Status configuration for UI styling
 * Similar to attendance STATUS_CONFIG
 */
export const PARTICIPANT_STATUS_CONFIG: Record<
  EventParticipantStatus,
  {
    icon: LucideIcon;
    color: ColorTokens;
    bgColor: ColorTokens;
    label: string;
  }
> = {
  [EVENT_PARTICIPANT_STATUS.ABSENT]: {
    icon: X,
    color: "$softGrayDark",
    bgColor: "$softGrayLighter",
    label: "statusAbsent",
  },
  [EVENT_PARTICIPANT_STATUS.ATTENDING]: {
    icon: Clock,
    color: "$chineseGold",
    bgColor: "$chineseGoldLighter",
    label: "statusAttending",
  },
  [EVENT_PARTICIPANT_STATUS.PAID]: {
    icon: Check,
    color: "$jadeGreen",
    bgColor: "$jadeGreenLighter",
    label: "statusPaid",
  },
};
