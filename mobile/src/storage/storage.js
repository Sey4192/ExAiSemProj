import AsyncStorage from "@react-native-async-storage/async-storage";

// Everything is stored only on the device -- usage data never leaves
// the phone except to be scored by your own backend.
const KEYS = {
  history: "exai.history.v1",
  onboarded: "exai.onboarded.v1",
  serverUrl: "exai.serverUrl.v1",
  profile: "exai.profile.v1",
  reminders: "exai.reminders.v1",
};

// What the user lets the app do in the background. Gentle by default:
// one evening check-in and a follow-up after a heavy session.
export const DEFAULT_REMINDERS = {
  morning: false,
  evening: true,
  lateNight: false,
  followUps: true,
  companion: false,
};

const MAX_HISTORY = 200;

async function readJson(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export async function loadHistory() {
  return readJson(KEYS.history, []);
}

export async function saveHistory(items) {
  await AsyncStorage.setItem(KEYS.history, JSON.stringify(items.slice(0, MAX_HISTORY)));
}

export async function clearHistory() {
  await AsyncStorage.removeItem(KEYS.history);
}

export async function hasOnboarded() {
  return (await AsyncStorage.getItem(KEYS.onboarded)) === "1";
}

export async function setOnboarded() {
  await AsyncStorage.setItem(KEYS.onboarded, "1");
}

export async function loadServerUrl() {
  return AsyncStorage.getItem(KEYS.serverUrl);
}

export async function saveServerUrl(url) {
  if (url) await AsyncStorage.setItem(KEYS.serverUrl, url);
  else await AsyncStorage.removeItem(KEYS.serverUrl);
}

// { name, mood: { key, at } } -- the small personal touches.
export async function loadProfile() {
  return readJson(KEYS.profile, {});
}

export async function saveProfile(profile) {
  await AsyncStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

export async function loadReminders() {
  return { ...DEFAULT_REMINDERS, ...(await readJson(KEYS.reminders, {})) };
}

export async function saveReminders(prefs) {
  await AsyncStorage.setItem(KEYS.reminders, JSON.stringify(prefs));
}
