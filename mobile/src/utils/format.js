import { colors } from "../theme/theme";

// One place for how each model feature is named and shown to the user.
export const FEATURES = {
  screen_time_hrs: {
    label: "Your screen time today",
    short: "Screen time",
    icon: "cellphone",
    format: (v) => formatHours(v),
  },
  frequency: {
    label: "How often you reached for the app",
    short: "App opens",
    icon: "gesture-tap",
    format: (v) => `${Math.round(v)}×`,
  },
  session_duration_min: {
    label: "How long you'd been on",
    short: "Session length",
    icon: "timer-sand",
    format: (v) => formatMinutes(v),
  },
  hour_of_day: {
    label: "How late it was",
    short: "Time of day",
    icon: "clock-outline",
    format: (v) => formatHourOfDay(v),
  },
};

export const FEATURE_KEYS = Object.keys(FEATURES);

export function featureLabel(key) {
  return FEATURES[key]?.label || key;
}

export function formatHours(hrs) {
  const total = Math.round(Number(hrs) * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatMinutes(min) {
  const m = Math.round(Number(min));
  if (m < 60) return `${m} min`;
  return formatHours(m / 60);
}

export function formatHourOfDay(hour) {
  const h = Math.round(Number(hour)) % 24;
  const suffix = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${suffix}`;
}

export function percent(p) {
  return `${Math.round(Number(p) * 100)}%`;
}

// The model makes a binary call at 0.5; the "moderate" band is only a
// display nuance so a 51% session doesn't read the same as a 95% one.
// Labels describe how a session *felt*, not a clinical risk class.
export function riskLevel(prob) {
  if (prob >= 0.7) return { key: "high", label: "Heavy session", color: colors.high, bg: colors.highBg };
  if (prob >= 0.5) return { key: "medium", label: "Getting heavy", color: colors.medium, bg: colors.mediumBg };
  return { key: "low", label: "Balanced", color: colors.low, bg: colors.lowBg };
}

export function greeting(name, date = new Date()) {
  const h = date.getHours();
  const base = h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${base}, ${name}` : base;
}

export function relativeTime(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function clockTime(ts) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function dayLabel(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
}

// Plain-language reading of one SHAP value, for the explanation screen.
export function contributionPhrase(value) {
  const a = Math.abs(value);
  if (value >= 0) {
    return a >= 0.1 ? "made this a lot heavier" : a >= 0.03 ? "made this a bit heavier" : "barely made a difference";
  }
  return a >= 0.1 ? "kept this a lot lighter" : a >= 0.03 ? "kept this a bit lighter" : "barely made a difference";
}
