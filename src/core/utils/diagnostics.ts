import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform, Share } from "react-native";
import { formatReport } from "./diagnosticsReport";

/**
 * On-device diagnostics for builds without a debugger (preview, production):
 * the last fatal JS error is kept and offered on the next launch, and a failed
 * sync shows its server message. Both can be shared as text.
 */

const CRASH_KEY = "@evolync:lastCrash";
/** How long a fatal error waits for its report to be written before the app closes. */
const SAVE_TIMEOUT_MS = 800;

interface ErrorUtilsLike {
  getGlobalHandler: () => (error: unknown, isFatal?: boolean) => void;
  setGlobalHandler: (handler: (error: unknown, isFatal?: boolean) => void) => void;
}

let installed = false;

const device = () => `${Platform.OS} ${Platform.Version}`;

/** Wraps the global JS error handler so a fatal error is saved before the app closes. */
export function installCrashRecorder(): void {
  const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;
  if (installed || !errorUtils) return;
  installed = true;

  const previous = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    if (!isFatal) return previous(error, isFatal);
    const report = formatReport(error, { device: device(), time: new Date().toISOString() });
    const saved = AsyncStorage.setItem(CRASH_KEY, report).catch(() => undefined);
    const timeout = new Promise((resolve) => setTimeout(resolve, SAVE_TIMEOUT_MS));
    Promise.race([saved, timeout]).finally(() => previous(error, isFatal));
  });
}

const share = (message: string) => Share.share({ message }).catch(console.error);

/** Shows the report of the last crash once, if the previous run ended with one. */
export async function showLastCrashReport(): Promise<void> {
  const report = await AsyncStorage.getItem(CRASH_KEY).catch(() => null);
  if (!report) return;
  await AsyncStorage.removeItem(CRASH_KEY).catch(() => undefined);
  Alert.alert(t("crashReportTitle"), `${t("crashReportMessage")}\n\n${report}`, [
    { text: t("close"), style: "cancel" },
    { text: t("share"), onPress: () => share(report) },
  ]);
}

/** Explains a failed sync: the server's message, with Share and Retry. */
export function showSyncErrorReport(error: string, onRetry: () => void): void {
  const report = formatReport(error, { device: device(), time: new Date().toISOString() });
  Alert.alert(t("syncFailed"), error, [
    { text: t("close"), style: "cancel" },
    { text: t("share"), onPress: () => share(report) },
    { text: t("retry"), onPress: onRetry },
  ]);
}
