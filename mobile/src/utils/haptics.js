import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

// Small wrappers so screens don't each handle the web case (no haptics
// there) or a rejected promise on devices without a vibration motor.
const enabled = Platform.OS !== "web";
const safe = (fn) => (...args) => {
  if (!enabled) return;
  fn(...args).catch(() => {});
};

export const tap = safe(() => Haptics.selectionAsync());
export const press = safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const success = safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
// "Warning" rather than "Error" for high risk -- a nudge, not an alarm.
export const nudge = safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
