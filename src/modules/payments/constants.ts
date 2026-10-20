import { Check, Clock, CreditCard, X, type LucideIcon } from "lucide-react-native";
import type { ColorTokens } from "tamagui";
import { neutral, success, warning } from "@/core/theme/tokens";
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
    bgColor: "$successSurface",
    label: "statusPaid",
  },
  [PaymentStatusEnum.PENDING]: {
    icon: Clock,
    color: "$chineseGold",
    bgColor: "$warningSurface",
    label: "statusPending",
  },
  [PaymentStatusEnum.CANCELLED]: {
    icon: X,
    color: "$textSecondary",
    bgColor: "$fillSubtle",
    label: "statusCancelled",
  },
};

export const STATUS_CYCLE: PaymentStatus[] = [
  PaymentStatusEnum.PENDING,
  PaymentStatusEnum.PAID,
  PaymentStatusEnum.CANCELLED,
];

/** Order of statuses in the 14B Status summary legend and the Amounts rows. */
export const PAYMENT_SUMMARY_ORDER: PaymentStatus[] = [
  PaymentStatusEnum.PAID,
  PaymentStatusEnum.PENDING,
  PaymentStatusEnum.CANCELLED,
];

/**
 * Icon, colors and labels of a payment status on the redesigned screens
 * (14B summary, status buttons, Amounts): Paid card (green), Pending clock
 * (amber), Cancelled x (neutral; its bar segment darker, for contrast).
 */
export const PAYMENT_STATUS_STYLE: Record<
  PaymentStatus,
  { icon: LucideIcon; tint: string; fill: string; barColor: string; label: string; amountsLabel: string }
> = {
  [PaymentStatusEnum.PAID]: {
    icon: CreditCard,
    tint: success.text,
    fill: success.fill,
    barColor: success.text,
    label: "statusPaid",
    amountsLabel: "paymentsAmountsCollected",
  },
  [PaymentStatusEnum.PENDING]: {
    icon: Clock,
    tint: warning.text,
    fill: warning.fill,
    barColor: warning.text,
    label: "statusPending",
    amountsLabel: "paymentsAmountsPending",
  },
  [PaymentStatusEnum.CANCELLED]: {
    icon: X,
    tint: neutral.tint,
    fill: neutral.tintFill,
    barColor: neutral.control,
    label: "statusCancelled",
    amountsLabel: "statusCancelled",
  },
};
