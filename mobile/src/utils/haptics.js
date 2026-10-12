import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

const enabled = Platform.OS !== "web";
const safe = (fn) => (...args) => {
  if (!enabled) return;
  fn(...args).catch(() => {});
};

export const tap = safe(() => Haptics.selectionAsync());
export const press = safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const success = safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const nudge = safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
