import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Cross-platform secure storage for auth session/org data.
 * Native: Expo SecureStore. Web: AsyncStorage (SecureStore is native-only).
 */

export const safeStorageGet = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") {
    try {
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return await SecureStore.getItemAsync(key);
};

export const safeStorageSet = async (
  key: string,
  value: string,
): Promise<void> => {
  if (Platform.OS === "web") {
    try {
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error("Storage set error:", error);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

export const safeStorageDelete = async (key: string): Promise<void> => {
  if (Platform.OS === "web") {
    try {
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error("Storage delete error:", error);
    }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};
