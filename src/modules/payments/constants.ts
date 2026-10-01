import { Check, Clock, X, type LucideIcon } from "lucide-react-native";
import type { ColorTokens } from "tamagui";
import {
  type PaymentStatus,
  PaymentStatus as PaymentStatusEnum,
} from "@/database/models/PaymentRecord";

export const STATUS_CONFIG: Record<
  PaymentStatus,
  {
    icon: LucideIcon;
    color: ColorTokens;
    bgColor: ColorTokens;
    label: string;
  }
> = {
  [PaymentStatusEnum.PAID]: {
    icon: Check,
    color: "$jadeGreen",
    bgColor: "$jadeGreenLighter",
    label: "statusPaid",
  },
  [PaymentStatusEnum.PENDING]: {
    icon: Clock,
    color: "$chineseGold",
    bgColor: "$chineseGoldLighter",
    label: "statusPending",
  },
  [PaymentStatusEnum.CANCELLED]: {
    icon: X,
    color: "$softGrayDark",
    bgColor: "$softGrayLighter",
    label: "statusCancelled",
  },
};

export const STATUS_CYCLE: PaymentStatus[] = [
  PaymentStatusEnum.PENDING,
  PaymentStatusEnum.PAID,
  PaymentStatusEnum.CANCELLED,
];
