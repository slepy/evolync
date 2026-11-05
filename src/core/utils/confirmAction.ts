import { Alert, Platform } from "react-native";

/** Destructive confirmation that also works on web (Alert is a no-op there). */
export const confirmAction = (title: string, message: string, confirmLabel: string, onConfirm: () => void) => {
  if (Platform.OS === "web") {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: t("cancel"), style: "cancel" },
    { text: confirmLabel, style: "destructive", onPress: onConfirm },
  ]);
};

/** Error notice that also works on web. */
export const showError = (message: string) => {
  if (Platform.OS === "web") {
    globalThis.alert?.(message);
    return;
  }
  Alert.alert(t("error"), message);
};

/**
 * "Change a paid status?" before a tap moves a payment or an event participant
 * out of Paid (14B5 / 10D2); `name` is the member, or the period / event title on
 * student details. Cancel leaves the row as it is.
 */
export const confirmLeavePaid = (name: string, nextStatusLabel: string, onConfirm: () => void) =>
  confirmAction(
    t("paidChangeConfirmTitle"),
    t("paidChangeConfirmMessage", { name, status: nextStatusLabel }),
    t("change"),
    onConfirm,
  );
