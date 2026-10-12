import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import { loadHistory, loadReminders } from "../storage/storage";
import { planReminders } from "./notifications";

// Pre-rename ID, kept so an already-registered task still matches.
export const BACKGROUND_TASK = "exai-background-refresh";

// Must be defined at module scope, before the app renders.
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
    return false;
  }
}
