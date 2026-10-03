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
