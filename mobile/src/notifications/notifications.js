import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { colors } from "../theme/theme";

// Local notifications only: everything is scheduled on the phone, so it
// works in Expo Go and nothing is sent from a server.

const CHANNEL_CHECKINS = "checkins";
const CHANNEL_COMPANION = "companion";
const CATEGORY_CHECKIN = "checkin";
const COMPANION_ID = "exai-companion"; // pre-rename ID, so an existing pinned notification can still be removed
const DAYS_AHEAD = 3;

// Each slot has a few phrasings so reminders don't feel copy-pasted.
export const REMINDER_SLOTS = {
  morning: {
    hour: 9,
    minute: 0,
    label: "Morning intention",
    detail: "9:00 AM · set the tone for the day",
    messages: [
      { title: "Good morning", body: "What's one thing you'd rather do with your time today than scroll?" },
      { title: "Morning check", body: "Before the feeds pull you in: how do you want today to feel?" },
      { title: "A fresh start", body: "Want to decide now how much phone time today deserves?" },
    ],
  },
  evening: {
    hour: 20,
    minute: 0,
    label: "Evening check-in",
    detail: "8:00 PM · skipped if you've already checked in",
    messages: [
      { title: "How was today?", body: "Got a minute? Let's look at how your day on your phone went." },
      { title: "Evening check-in", body: "How are you feeling after today? A quick check can help you wind down." },
      { title: "Hey, just checking in", body: "Long day? See how your scrolling's been, no judgement." },
    ],
  },
  lateNight: {
    hour: 23,
    minute: 0,
    label: "Late-night wind-down",
    detail: "11:00 PM · a nudge towards rest",
    messages: [
      { title: "It's getting late", body: "Your sleep will thank you. Ready to put the phone down for tonight?" },
      { title: "Still up?", body: "Late-night scrolling tends to run long. Want to call it a night?" },
      { title: "Time to rest", body: "Whatever's on there will still be there tomorrow. Sleep well." },
    ],
  },
};

const FOLLOW_UPS = [
  { title: "How are you doing?", body: "That last session was a heavy one. How are you feeling now?" },
  { title: "Thinking of you", body: "Did you manage to take a break earlier? Tap to check in." },
];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

export async function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_CHECKINS, {
      name: "Check-ins",
      description: "Gentle reminders to check in with yourself",
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: colors.primary,
    });
    // Silent and low priority, so the always-there shortcut never buzzes.
    await Notifications.setNotificationChannelAsync(CHANNEL_COMPANION, {
      name: "Quick check-in shortcut",
      description: "Keeps Tymeout one tap away in your notifications",
      importance: Notifications.AndroidImportance.LOW,
      sound: null,
      vibrationPattern: null,
      enableVibrate: false,
    });
  }

  await Notifications.setNotificationCategoryAsync(CATEGORY_CHECKIN, [
    { identifier: "check-in", buttonTitle: "Check in", options: { opensAppToForeground: true } },
    { identifier: "im-okay", buttonTitle: "I'm okay", options: { opensAppToForeground: false } },
  ]);
}

export async function getPermission() {
  const { granted, canAskAgain } = await Notifications.getPermissionsAsync();
  return { granted, canAskAgain };
}

export async function requestPermission() {
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}

function content({ title, body }, screen, extra = {}) {
  return {
    title,
    body,
    data: { screen, ...extra },
    categoryIdentifier: CATEGORY_CHECKIN,
    color: colors.primary,
  };
}

async function cancelKind(kind) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.kind === kind)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

function checkedInToday(history) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return history.some((h) => h.timestamp >= start.getTime());
}

// Re-plans reminders for the next few days. Each reminder is a one-off
// at an exact time (not a blind daily repeat), so the evening check-in can
// be skipped on days the user has already checked in, and the wording
// rotates. Called on launch, after each check, on settings changes and
// from the background task.
export async function planReminders(prefs, history = []) {
  if (!(await getPermission()).granted) return;
  await cancelKind("reminder");

  const now = Date.now();
  const doneToday = checkedInToday(history);

  for (let day = 0; day < DAYS_AHEAD; day++) {
    for (const [key, slot] of Object.entries(REMINDER_SLOTS)) {
      if (!prefs[key]) continue;
      const when = new Date();
      when.setDate(when.getDate() + day);
      when.setHours(slot.hour, slot.minute, 0, 0);
      if (when.getTime() <= now + 60 * 1000) continue;
      if (day === 0 && key === "evening" && doneToday) continue;

      await Notifications.scheduleNotificationAsync({
        content: content(pick(slot.messages), key === "lateNight" ? "Break" : "Check", { kind: "reminder", slot: key }),
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: CHANNEL_CHECKINS },
      });
    }
  }
}

// After a high-risk session, ask how the user is doing a couple of hours
// later. Only one follow-up is ever pending.
export async function scheduleFollowUp(prefs, delayMinutes = 120) {
  if (!prefs.followUps || !(await getPermission()).granted) return;
  await cancelKind("follow-up");
  await Notifications.scheduleNotificationAsync({
    content: content(pick(FOLLOW_UPS), "Home", { kind: "follow-up" }),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delayMinutes * 60,
      channelId: CHANNEL_CHECKINS,
    },
  });
}

// An optional, silent notification that stays in the shade so a check-in
// is always one tap away, without opening the app from the home screen.
export async function setCompanion(enabled) {
  await Notifications.dismissNotificationAsync(COMPANION_ID).catch(() => {});
  if (!enabled || !(await getPermission()).granted) return;
  await Notifications.scheduleNotificationAsync({
    identifier: COMPANION_ID,
    content: {
      title: "Tymeout is here when you need it",
      body: "Tap to check in on how your scrolling's going.",
      data: { screen: "Check", kind: "companion" },
      sticky: true,
      autoDismiss: false,
      priority: Notifications.AndroidNotificationPriority.LOW,
      color: colors.primary,
    },
    trigger: Platform.OS === "android" ? { channelId: CHANNEL_COMPANION } : null,
  });
}

export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: content({ title: "This is how I'll check in", body: "Gentle, quiet, and only as often as you choose." }, "Home", {
      kind: "test",
    }),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
      channelId: CHANNEL_CHECKINS,
    },
  });
}
