import React, { useState } from "react";
import { Alert, Linking, Platform, ScrollView, StyleSheet, Switch, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, type } from "../theme/theme";
import { useApp } from "../context/AppContext";
import { DEFAULT_API_BASE_URL, checkHealth } from "../api/client";
import { REMINDER_SLOTS, sendTestNotification } from "../notifications/notifications";
import GradientHeader from "../components/GradientHeader";
import { IconBadge, SectionHeader, SurfaceCard } from "../components/Surface";
import { tap } from "../utils/haptics";

const REMINDER_ROWS = [
  { key: "morning", icon: "weather-sunset-up", ...REMINDER_SLOTS.morning },
  { key: "evening", icon: "weather-sunset-down", ...REMINDER_SLOTS.evening },
  { key: "lateNight", icon: "weather-night", ...REMINDER_SLOTS.lateNight },
  {
    key: "followUps",
    icon: "hand-heart-outline",
    label: "After a heavy session",
    detail: "I'll ask how you're doing a couple of hours later",
  },
  {
    key: "companion",
    icon: "pin-outline",
    label: "Keep me in your notifications",
    detail: "A quiet shortcut, so checking in is always one tap away",
  },
];

export default function SettingsScreen({ navigation }) {
  const {
    serverUrl,
    updateServerUrl,
    history,
    clearHistory,
    profile,
    updateProfile,
    reminders,
    updateReminders,
    notificationsAllowed,
    enableNotifications,
  } = useApp();
  const [name, setName] = useState(profile.name || "");
  const [url, setUrl] = useState(serverUrl || DEFAULT_API_BASE_URL);
  const [status, setStatus] = useState(null); // null | "testing" | "ok" | "fail"
  const [saved, setSaved] = useState(false);
  const [asking, setAsking] = useState(false);

  const test = async () => {
    setStatus("testing");
    try {
      const res = await checkHealth(url);
      setStatus(res.model_loaded ? "ok" : "fail");
    } catch {
      setStatus("fail");
    }
  };

  const save = async () => {
    await updateServerUrl(url === DEFAULT_API_BASE_URL ? null : url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => {
    setUrl(DEFAULT_API_BASE_URL);
    setStatus(null);
    updateServerUrl(null);
  };

  const turnOn = async () => {
    setAsking(true);
    const granted = await enableNotifications();
    setAsking(false);
    if (!granted) {
      Alert.alert(
        "Notifications are off",
        "No problem. If you change your mind, you can allow notifications for Tymeout in your phone's settings.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Open settings", onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const confirmClear = () =>
    Alert.alert("Start fresh?", "This clears all your check-ins from this phone. It can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearHistory },
    ]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <GradientHeader onBack={() => navigation.goBack()} eyebrow="Settings" title="Make it yours" compact />

      <View style={styles.body}>
        <SectionHeader title="About you" />
        <SurfaceCard>
          <Text style={styles.help}>What should I call you?</Text>
          <TextInput
            mode="outlined"
            value={name}
            placeholder="Your name"
            onChangeText={setName}
            onBlur={() => updateProfile({ name: name.trim() || undefined })}
            autoCapitalize="words"
            maxLength={24}
            left={<TextInput.Icon icon="account-heart-outline" />}
            style={styles.input}
            outlineStyle={{ borderRadius: radius.md }}
          />
        </SurfaceCard>

        <SectionHeader title="Check-ins" />
        {!notificationsAllowed ? (
          <SurfaceCard style={styles.askCard}>
            <View style={styles.row}>
              <IconBadge icon="bell-badge-outline" size={44} />
              <View style={{ flex: 1, marginLeft: spacing.md - 4 }}>
                <Text style={styles.askTitle}>Can I check in with you?</Text>
                <Text style={styles.help}>
                  Gentle nudges only, like an evening check-in. Never more than you choose.
                </Text>
              </View>
            </View>
            <Button mode="contained" icon="bell-outline" onPress={turnOn} loading={asking} style={styles.wide}>
              Turn on check-ins
            </Button>
          </SurfaceCard>
        ) : (
          <SurfaceCard padded={false}>
            {REMINDER_ROWS.map((r, i) => (
              <View key={r.key} style={[styles.toggleRow, i > 0 && styles.toggleBorder]}>
                <MaterialCommunityIcons name={r.icon} size={22} color={colors.primary} />
                <View style={styles.toggleText}>
                  <Text style={styles.toggleLabel}>{r.label}</Text>
                  <Text style={styles.toggleDetail}>{r.detail}</Text>
                </View>
                <Switch
                  value={!!reminders[r.key]}
                  onValueChange={(v) => {
                    tap();
                    updateReminders({ [r.key]: v });
                  }}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor={Platform.OS === "android" ? "#fff" : undefined}
                />
              </View>
            ))}
            <View style={[styles.toggleBorder, styles.testRow]}>
              <Button mode="text" icon="bell-ring-outline" onPress={sendTestNotification} compact>
                Send me a test
              </Button>
            </View>
          </SurfaceCard>
        )}

        <SectionHeader title="Connection" />
        <SurfaceCard>
          <Text style={styles.help}>
            Where your Tymeout server is running. Use your laptop's Wi-Fi address, not "localhost".
          </Text>
          <TextInput
            mode="outlined"
            value={url}
            onChangeText={(t) => {
              setUrl(t);
              setStatus(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            left={<TextInput.Icon icon="server-network" />}
            style={styles.input}
            outlineStyle={{ borderRadius: radius.md }}
          />

          {status && status !== "testing" ? (
            <View style={[styles.status, { backgroundColor: status === "ok" ? colors.lowBg : colors.highBg }]}>
              <MaterialCommunityIcons
                name={status === "ok" ? "check-circle" : "close-circle"}
                size={18}
                color={status === "ok" ? colors.low : colors.high}
              />
              <Text style={styles.statusText}>
                {status === "ok"
                  ? "Connected. I'm ready when you are."
                  : "I couldn't connect. Check the address, and that app.py is running."}
              </Text>
            </View>
          ) : null}

          <View style={styles.buttons}>
            <Button mode="outlined" onPress={test} loading={status === "testing"} style={styles.button}>
              Test
            </Button>
            <Button mode="contained" onPress={save} icon={saved ? "check" : undefined} style={styles.button}>
              {saved ? "Saved" : "Save"}
            </Button>
          </View>
          {serverUrl ? (
            <Button mode="text" onPress={reset} compact style={{ alignSelf: "flex-start" }}>
              Reset to default
            </Button>
          ) : null}
        </SurfaceCard>

        <SectionHeader title="Your privacy" />
        <SurfaceCard style={styles.row}>
          <IconBadge icon="shield-lock-outline" size={40} />
          <Text style={[styles.help, { flex: 1, marginLeft: spacing.md - 4, marginBottom: 0 }]}>
            Your {history.length} check-in{history.length === 1 ? "" : "s"}, your name and your moods stay on this phone. Sessions
            are only sent to your own Tymeout server to be understood, never anywhere else.
          </Text>
        </SurfaceCard>
        <Button
          mode="outlined"
          icon="trash-can-outline"
          onPress={confirmClear}
          disabled={!history.length}
          textColor={colors.high}
          style={styles.clear}
        >
          Clear my check-ins
        </Button>

        <SectionHeader title="About Tymeout" />
        <SurfaceCard>
          <Text style={styles.help}>
            Tymeout helps you notice when scrolling stops feeling good, and always explains why, so the choice of what to do next
            stays yours.
          </Text>
          <Text style={styles.help}>
            Under the hood: a Random Forest model looks at your session, SHAP and LIME explain what it noticed, and a gentle
            persuasion engine picks a message that fits.
          </Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </SurfaceCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  body: { paddingHorizontal: spacing.lg },
  help: { ...type.small, color: colors.textMuted, marginBottom: spacing.md - 4 },
  input: { backgroundColor: colors.surface },
  row: { flexDirection: "row", alignItems: "center" },
  askCard: { gap: spacing.sm },
  askTitle: { ...type.h3, color: colors.text, marginBottom: 2 },
  wide: { borderRadius: radius.md },
  toggleRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md - 2, paddingHorizontal: spacing.md },
  toggleBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  toggleText: { flex: 1, marginHorizontal: spacing.md - 4 },
  toggleLabel: { ...type.small, color: colors.text, fontFamily: fonts.semibold },
  toggleDetail: { ...type.caption, color: colors.textMuted, marginTop: 1 },
  testRow: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, alignItems: "flex-start" },
  status: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radius.md, padding: spacing.md - 4, marginTop: spacing.md },
  statusText: { ...type.small, color: colors.text, flex: 1 },
  buttons: { flexDirection: "row", gap: spacing.sm + 2, marginTop: spacing.md },
  button: { flex: 1, borderRadius: radius.md },
  clear: { marginTop: spacing.sm + 2, borderRadius: radius.md, borderColor: colors.border },
  version: { ...type.caption, color: colors.textFaint },
});
