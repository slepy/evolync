import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Platform-safe key/value storage for device-local preferences
 * (language, theme). Uses localStorage on web, AsyncStorage elsewhere.
 */
export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Ignore localStorage errors on web
      }
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
};
