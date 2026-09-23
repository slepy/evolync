import { Alert } from "react-native";

export const confirmDelete = (
  title: string,
  message: string,
  onConfirm: () => void
) =>
  Alert.alert(title, message, [
    { text: t("cancel"), style: "cancel" },
    { text: t("delete"), style: "destructive", onPress: onConfirm },
  ]);
