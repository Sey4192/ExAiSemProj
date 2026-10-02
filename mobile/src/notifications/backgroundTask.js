import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import { loadHistory, loadReminders } from "../storage/storage";
import { planReminders } from "./notifications";

export const BACKGROUND_TASK = "exai-background-refresh";

// Runs every so often while the app is closed (the OS decides exactly
// when; at most every ~15 min on Android). It keeps the next few days of
// check-ins planned and fresh -- e.g. dropping tonight's evening
// reminder once the user has already checked in -- without the app
// being opened. Must be defined at module scope, before the app renders.
TaskManager.defineTask(BACKGROUND_TASK, async () => {
  try {
    const [prefs, history] = await Promise.all([loadReminders(), loadHistory()]);
    await planReminders(prefs, history);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundTask() {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status !== BackgroundTask.BackgroundTaskStatus.Available) return false;
    if (!(await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK))) {
      await BackgroundTask.registerTaskAsync(BACKGROUND_TASK, { minimumInterval: 60 });
    }
    return true;
  } catch {
    // Not available on this device/runtime (e.g. web): reminders still
    // work, they're just re-planned when the app is opened instead.
    return false;
  }
}
