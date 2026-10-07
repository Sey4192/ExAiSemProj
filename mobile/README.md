# Tymeout Mobile App: Setup Guide

React Native (Expo) app for the Explainable AI-Based Persuasive System.
It calls the Flask backend (see `backend/README.md`) for predictions,
SHAP/LIME explanations and interventions, and stores the user's check-in
history on the phone.

## 1. Prerequisites

- Node.js 20.19.4 or later (`node --version`)
- The Expo Go app on an Android or iOS phone
- The backend running on a laptop on the same Wi-Fi network
  (start it first; the app depends on it)

## 2. Setup

```bash
cd mobile
npm install
```

## 3. Point the app at the backend

The app uses the hosted backend at <https://seymatt.pythonanywhere.com> by
default (`DEFAULT_API_BASE_URL` in `src/api/client.js`), so it works on any
network. To use a backend running on your laptop instead, start Expo with
the laptop's Wi-Fi address (`ipconfig` on Windows), not "localhost":

```bash
EXPO_PUBLIC_API_URL=http://<laptop-ip>:5000 npx expo start
# Windows (PowerShell): $env:EXPO_PUBLIC_API_URL="http://<laptop-ip>:5000"; npx expo start
```

The phone and laptop must then be on the same Wi-Fi. The address can also
be changed inside the app under **Home > settings icon > Connection**,
which has a **Test** button.

## 4. Run it

```bash
npx expo start
```

Scan the QR code with Expo Go. After installing new packages, start with
`npx expo start --clear` to reset the bundler cache.

## 4a. Run it on a computer (web)

The same app runs in a browser through React Native Web. With
`npx expo start` running, press `w` or open <http://localhost:8081>. On a
wide screen the app keeps a phone-sized column in the middle of the
window. Check-in reminders are phone-only, because browsers cannot
schedule local notifications; everything else works the same.

The website is published on GitHub Pages at
<https://sey4192.github.io/ExAiSemProj/>. To rebuild it:

```bash
EXPO_BASE_URL=/ExAiSemProj npx expo export --platform web
```

The site is written to `dist/` (`app.config.js` applies the sub-path), and
the contents of `dist/` plus an empty `.nojekyll` file go on the `gh-pages`
branch.

## 4b. Build an installable APK (Android)

Requirements: JDK 17 and the Android SDK (platform 36, build-tools
36.0.0, NDK 27.1.12297006), with `JAVA_HOME` and `ANDROID_HOME` set.

```bash
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease        # Windows: gradlew.bat assembleRelease
```

The APK is written to `android/app/build/outputs/apk/release/app-release.apk`.
The `android/` folder is generated from `app.json` and is not committed.
The release build uses the hosted backend, so the installed app works on
any network. Expo signs release builds with a debug key; re-sign the APK
with your own release key (`apksigner`) before distributing it.

The native build compiles a lot of C++ and needs plenty of free memory.
On a laptop with 8 GB of RAM, close other programs first and limit Gradle
to one task at a time: add `--max-workers=1 -Dorg.gradle.parallel=false`.

## 5. What the app contains

On first launch, a four-slide **onboarding** introduces the app, asks
for the user's name and asks permission to send check-in reminders.
The app then has four tabs:

1. **Home**: greeting, a mood check-in ("How are you feeling right now?"),
   the latest check-in's risk ring and statistics, today's summary, recent
   check-ins and a daily suggestion. "or try a sample session" calls
   `/simulate_session`.
2. **Check**: the user describes a session (screen time, app opens,
   session length, time of day) or picks a scenario, and it is scored
   with `/predict`.
3. **History**: saved check-ins grouped by day, with filters, stored only
   on the phone (AsyncStorage).
4. **Insights**: personal patterns (average risk, risk by time of day,
   most common factor) and the model's performance from `/metrics`.

Each check-in leads to the core flow shown in the report (Figure 4.1):

- **High risk**: an alert with the persuasion engine's message, a risk
  ring and "Why am I seeing this?". "Take a breather" opens a one-minute
  guided breathing exercise.
- **Low risk**: a result screen naming the factor that kept the session
  balanced.
- **Explanation**: the main factor, a plain-language summary, and SHAP
  and LIME contribution bars side by side, showing whether each factor
  raised or lowered the risk and whether the two methods agree.

`/simulate_session` picks sessions at random, so run it a few times to
see both outcomes, or use the "Can't put it down" scenario on the Check tab
for a high-risk session.

## 6. Check-ins and notifications

The app asks for notification permission in its own words first, on the
last onboarding slide, before the system prompt appears. All reminders
are local notifications scheduled on the phone, so they work in Expo Go
without a server. In **Settings > Check-ins** the user can turn on:

- **Morning intention** (9 AM), **Evening check-in** (8 PM, skipped on
  days the user has already checked in) and **Late-night wind-down** (11 PM)
- **After a heavy session**: a follow-up two hours later
- **Keep me in your notifications**: a silent notification that stays in
  the notification shade as a shortcut to check in

Notifications have **Check in** and **I'm okay** buttons, and tapping one
opens the matching screen. A background task (`expo-background-task`,
scheduled by the operating system) re-plans the next three days of
reminders while the app is closed. Code: `src/notifications/`.

## 7. Project structure

- `App.js`: navigation, font loading and notification routing
- `src/screens/`: the ten screens
- `src/components/`: shared interface components
- `src/api/client.js`: Flask API client
- `src/notifications/`: reminder scheduling and the background task
- `src/storage/`: on-device storage
- `src/theme/theme.js`: colours, typography and spacing

## 8. Design notes

The interface uses a calm palette of soft blues and greens, the Plus
Jakarta Sans typeface and a floating tab bar. High risk is shown in
amber, not red, and the wording asks questions instead of giving
warnings. Chapter 3 (Section 3.7) explains the reason: a wellbeing app
that causes anxiety works against its own purpose.

## 9. Known limitations

- The app does not track usage automatically. Reading other apps' screen
  time needs Android's Usage Access permission and native code, which
  requires a custom development build instead of Expo Go (Chapter 5,
  Section 5.6). Statistics come from the user's check-ins.
- There is no automated test suite for the mobile app; the backend has 17
  automated tests.
