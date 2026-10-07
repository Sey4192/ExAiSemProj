// API client for the Flask backend (see backend/README.md).
// By default the app uses the hosted backend on PythonAnywhere, so it works
// on any network. To use a backend running on your laptop instead, start
// Expo with EXPO_PUBLIC_API_URL set to the laptop's local IP address (not
// "localhost" -- your phone can't resolve "localhost" as your laptop), e.g.
// EXPO_PUBLIC_API_URL=http://192.168.1.20:5000, with both devices on the
// same Wi-Fi. The address can also be changed in the app: Home -> settings.
export const DEFAULT_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://seymatt.pythonanywhere.com";

let baseUrl = DEFAULT_API_BASE_URL;

export function getBaseUrl() {
  return baseUrl;
}

export function setBaseUrl(url) {
  baseUrl = (url || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, "");
}

const TIMEOUT_MS = 15000;

async function request(path, options = {}, url = baseUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${url}${path}`, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      ...options,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed: ${res.status}`);
    }
    return res.json();
  } catch (e) {
    if (e.name === "AbortError") throw new Error("That took longer than it should. Mind trying again?");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export function checkHealth(url) {
  return request("/health", {}, url ? url.trim().replace(/\/+$/, "") : baseUrl);
}

export function predictSession(features) {
  return request("/predict", {
    method: "POST",
    body: JSON.stringify(features),
  });
}

export function simulateSession() {
  return request("/simulate_session");
}

export function getModelMetrics() {
  return request("/metrics");
}

export const CONNECTION_HELP =
  "I can't reach the Tymeout server right now. Check your internet connection and try again. " +
  "You can check the server address in Settings.";
