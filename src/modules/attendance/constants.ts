import { Check, FilePenLine, X, type LucideIcon } from "lucide-react-native";
import type { ColorTokens } from "tamagui";
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
    bgColor: "$jadeGreenLighter",
    label: "statusPresent",
  },
  [AttendanceStatusEnum.ABSENT]: {
    icon: X,
    color: "$softGrayDark",
    bgColor: "$softGrayLighter",
    label: "statusAbsent",
  },
  [AttendanceStatusEnum.EXCUSED]: {
    icon: FilePenLine,
    color: "$chineseGold",
    bgColor: "$chineseGoldLighter",
    label: "statusExcused",
  },
};
