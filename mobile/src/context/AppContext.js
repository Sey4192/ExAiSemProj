import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as storage from "../storage/storage";
import { setBaseUrl, simulateSession, predictSession, CONNECTION_HELP } from "../api/client";
import * as haptics from "../utils/haptics";
import * as notifications from "../notifications/notifications";
import { registerBackgroundTask } from "../notifications/backgroundTask";

const AppContext = createContext(null);

// Notification calls are best-effort: they can fail on web or if the OS
// refuses, and that must never break the app itself.
const quietly = (fn) => fn().catch(() => {});

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [history, setHistory] = useState([]);
  const [onboarded, setOnboardedState] = useState(false);
  const [serverUrl, setServerUrlState] = useState(null);
  const [profile, setProfile] = useState({});
  const [reminders, setReminders] = useState(storage.DEFAULT_REMINDERS);
  const [notificationsAllowed, setNotificationsAllowed] = useState(false);

  useEffect(() => {
    (async () => {
      const [h, o, url, p, r] = await Promise.all([
        storage.loadHistory(),
        storage.hasOnboarded(),
        storage.loadServerUrl(),
        storage.loadProfile(),
        storage.loadReminders(),
      ]);
      setHistory(h);
      setOnboardedState(o);
      setServerUrlState(url);
      setBaseUrl(url);
      setProfile(p);
      setReminders(r);
      setReady(true);

      await quietly(async () => {
        await notifications.configureNotifications();
        const { granted } = await notifications.getPermission();
        setNotificationsAllowed(granted);
        if (granted) {
          await notifications.planReminders(r, h);
          await notifications.setCompanion(r.companion);
          await registerBackgroundTask();
        }
      });
    })();
  }, []);

  const addResult = useCallback(
    (result, source) => {
      const entry = { id: `${Date.now()}`, timestamp: Date.now(), source, result };
      setHistory((prev) => {
        const next = [entry, ...prev];
        storage.saveHistory(next);
        // Checking in counts for today, so tonight's reminder can be skipped.
        quietly(() => notifications.planReminders(reminders, next));
        return next;
      });
      if (result.risk_label === "high_risk") quietly(() => notifications.scheduleFollowUp(reminders));
      return entry;
    },
    [reminders]
  );

  const clearHistory = useCallback(async () => {
    await storage.clearHistory();
    setHistory([]);
    quietly(() => notifications.planReminders(reminders, []));
  }, [reminders]);

  const deleteEntry = useCallback(
    (id) => {
      setHistory((prev) => {
        const next = prev.filter((h) => h.id !== id);
        storage.saveHistory(next);
        // Deleting today's only check-in brings tonight's reminder back.
        quietly(() => notifications.planReminders(reminders, next));
        return next;
      });
    },
    [reminders]
  );

  const completeOnboarding = useCallback(async () => {
    await storage.setOnboarded();
    setOnboardedState(true);
  }, []);

  const updateServerUrl = useCallback(async (url) => {
    const clean = url ? url.trim().replace(/\/+$/, "") : null;
    await storage.saveServerUrl(clean);
    setServerUrlState(clean);
    setBaseUrl(clean);
  }, []);

  const updateProfile = useCallback(async (changes) => {
    setProfile((prev) => {
      const next = { ...prev, ...changes };
      storage.saveProfile(next);
      return next;
    });
  }, []);

  // Asks the OS for permission (only ever after the user has said yes in
  // our own words first), then starts reminders and background refresh.
  const enableNotifications = useCallback(async () => {
    let granted = false;
    await quietly(async () => {
      granted = await notifications.requestPermission();
      setNotificationsAllowed(granted);
      if (granted) {
        await notifications.planReminders(reminders, history);
        await notifications.setCompanion(reminders.companion);
        await registerBackgroundTask();
      }
    });
    return granted;
  }, [reminders, history]);

  const updateReminders = useCallback(
    async (changes) => {
      const next = { ...reminders, ...changes };
      setReminders(next);
      await storage.saveReminders(next);
      await quietly(async () => {
        await notifications.planReminders(next, history);
        if ("companion" in changes) await notifications.setCompanion(next.companion);
      });
    },
    [reminders, history]
  );

  const value = useMemo(
    () => ({
      ready,
      history,
      onboarded,
      serverUrl,
      profile,
      reminders,
      notificationsAllowed,
      addResult,
      clearHistory,
      deleteEntry,
      completeOnboarding,
      updateServerUrl,
      updateProfile,
      enableNotifications,
      updateReminders,
    }),
    [
      ready,
      history,
      onboarded,
      serverUrl,
      profile,
      reminders,
      notificationsAllowed,
      addResult,
      clearHistory,
      deleteEntry,
      completeOnboarding,
      updateServerUrl,
      updateProfile,
      enableNotifications,
      updateReminders,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

// Runs one check against the backend (a simulated session, or the
// user's own numbers), stores it in history and opens the matching
// result screen -- the Dashboard -> Alert/Result flow from Figure 4.1.
export function useRunCheck(navigation) {
  const { addResult } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (features) => {
      haptics.press();
      setLoading(true);
      setError(null);
      try {
        const result = features ? await predictSession(features) : await simulateSession();
        const entry = addResult(result, features ? "manual" : "simulated");
        if (result.risk_label === "high_risk") haptics.nudge();
        else haptics.success();
        navigation.navigate(result.risk_label === "high_risk" ? "Alert" : "LowRiskResult", { entry });
      } catch (e) {
        setError(e.message && !/Network request failed|fetch/i.test(e.message) ? e.message : CONNECTION_HELP);
      } finally {
        setLoading(false);
      }
    },
    [addResult, navigation]
  );

  return { run, loading, error, clearError: () => setError(null) };
}
