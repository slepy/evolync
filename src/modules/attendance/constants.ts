import { Check, FilePenLine, X, type LucideIcon } from "lucide-react-native";
import type { ColorTokens } from "tamagui";
import { neutral, success, warning } from "@/core/theme/tokens";
import {
  type AttendanceStatus,
  AttendanceStatus as AttendanceStatusEnum,
} from "@/database/models/AttendanceRecord";

export const STATUS_CONFIG: Record<
  AttendanceStatus,
  {
    icon: LucideIcon;
    color: ColorTokens;
    bgColor: ColorTokens;
    label: string;
  }
> = {
  [AttendanceStatusEnum.PRESENT]: {
    icon: Check,
    color: "$jadeGreen",
    bgColor: "$successSurface",
    label: "statusPresent",
  },
  [AttendanceStatusEnum.ABSENT]: {
    icon: X,
    color: "$textSecondary",
    bgColor: "$fillSubtle",
    label: "statusAbsent",
  },
  [AttendanceStatusEnum.EXCUSED]: {
    icon: FilePenLine,
    color: "$chineseGold",
    bgColor: "$warningSurface",
    label: "statusExcused",
  },
};

/** Order of statuses in the 13B / 13C Status summary legend. */
export const ATTENDANCE_SUMMARY_ORDER: AttendanceStatus[] = [
  AttendanceStatusEnum.PRESENT,
  AttendanceStatusEnum.EXCUSED,
  AttendanceStatusEnum.ABSENT,
];

/**
 * Icon, colors and label of an attendance status on the redesigned screens
 * (13B / 13C summary and status buttons): Present check (green), Excused
 * file-pen (amber), Absent x (neutral; its bar segment darker, for contrast).
 */
export const ATTENDANCE_STATUS_STYLE: Record<
  AttendanceStatus,
  { icon: LucideIcon; tint: string; fill: string; barColor: string; label: string }
> = {
  [AttendanceStatusEnum.PRESENT]: {
    icon: Check,
    tint: success.text,
    fill: success.fill,
    barColor: success.text,
    label: "statusPresent",
  },
  [AttendanceStatusEnum.EXCUSED]: {
    icon: FilePenLine,
    tint: warning.text,
    fill: warning.fill,
    barColor: warning.text,
    label: "statusExcused",
  },
  [AttendanceStatusEnum.ABSENT]: {
    icon: X,
    tint: neutral.tint,
    fill: neutral.tintFill,
    barColor: neutral.control,
    label: "statusAbsent",
  },
};
