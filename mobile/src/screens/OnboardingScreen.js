import React, { useRef, useState } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from "react-native";
import { Button, Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { gradients, radius, spacing, type, fonts } from "../theme/theme";
import { useApp } from "../context/AppContext";
import RiskGauge from "../components/RiskGauge";
import { tap } from "../utils/haptics";

const SLIDES = [
  {
    key: "hello",
    title: "Hey, I'm EXAI 👋",
    text: "I'm here to help you notice when scrolling stops feeling good. No judgement, no lectures, and I won't take over your phone.",
  },
  {
    key: "why",
    title: "I'll always tell you why",
    text: "Whenever I suggest a pause, you can see exactly what I noticed and why. No mystery and no guilt, just honesty.",
  },
  {
    key: "name",
    title: "What should I call you?",
    text: "Just a first name or a nickname. It stays on this phone.",
  },
  {
    key: "notify",
    title: "Can I check in with you?",
    text: "Now and then I'll send a gentle nudge, like an evening check-in, or asking how you are after a heavy session. You choose how often, and you can change it anytime.",
  },
];

// Small illustrations built from the app's own UI pieces, so the
// onboarding previews what the user will actually see.
function SlideArt({ slide, name }) {
  if (slide === "hello") {
    return (
      <View style={styles.mockCard}>
        <RiskGauge value={0.34} size={120} color="#FFFFFF" caption="balanced" />
        <View style={styles.mockChips}>
          {[
            ["cellphone", "2h 10m"],
            ["gesture-tap", "14×"],
            ["timer-sand", "12 min"],
          ].map(([icon, label]) => (
            <View key={label} style={styles.mockChip}>
              <MaterialCommunityIcons name={icon} size={13} color="#fff" />
              <Text style={styles.mockChipText}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }
  if (slide === "why") {
    const bars = [
      ["timer-sand", "Session length", 0.92],
      ["cellphone", "Screen time", 0.64],
      ["gesture-tap", "App opens", 0.36],
      ["clock-outline", "Time of day", 0.14],
    ];
    return (
      <View style={[styles.mockCard, styles.mockWide]}>
        <Text style={styles.mockTitle}>Here's what I noticed</Text>
        {bars.map(([icon, label, w]) => (
          <View key={label} style={styles.mockBarRow}>
            <MaterialCommunityIcons name={icon} size={14} color="rgba(255,255,255,0.85)" />
            <Text style={styles.mockBarLabel}>{label}</Text>
            <View style={styles.mockTrack}>
              <View style={[styles.mockFill, { width: `${w * 100}%` }]} />
            </View>
          </View>
        ))}
        <View style={styles.mockAgree}>
          <MaterialCommunityIcons name="check-decagram" size={14} color="#A8E0C1" />
          <Text style={styles.mockAgreeText}>Both explanations agree</Text>
        </View>
      </View>
    );
  }
  if (slide === "notify") {
    return (
      <View style={styles.notifyStack}>
        <View style={[styles.mockNotif, styles.mockNotifBack]} />
        <View style={styles.mockNotif}>
          <View style={styles.mockNotifHead}>
            <View style={styles.mockNotifIcon}>
              <MaterialCommunityIcons name="leaf" size={12} color="#fff" />
            </View>
            <Text style={styles.mockNotifApp}>EXAI · now</Text>
          </View>
          <Text style={styles.mockNotifTitle}>How was today{name ? `, ${name}` : ""}?</Text>
          <Text style={styles.mockNotifBody}>Got a minute? Let's look at how your day on your phone went.</Text>
          <View style={styles.mockNotifActions}>
            <Text style={styles.mockNotifAction}>Check in</Text>
            <Text style={styles.mockNotifAction}>I'm okay</Text>
          </View>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.calm}>
      <View style={[styles.calmRing, { width: 210, height: 210, borderRadius: 105, opacity: 0.35 }]} />
      <View style={[styles.calmRing, { width: 160, height: 160, borderRadius: 80, opacity: 0.6 }]} />
      <View style={styles.calmCore}>
        <MaterialCommunityIcons name="account-heart-outline" size={48} color="#fff" />
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const { completeOnboarding, updateProfile, enableNotifications } = useApp();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scroller = useRef(null);
  const [index, setIndex] = useState(0);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const slide = SLIDES[index].key;
  const last = index === SLIDES.length - 1;

  const goTo = (i) => {
    Keyboard.dismiss();
    scroller.current?.scrollTo({ x: width * i, animated: true });
    setIndex(i);
  };

  const next = () => {
    tap();
    if (slide === "name" && name.trim()) updateProfile({ name: name.trim() });
    goTo(index + 1);
  };

  // Our own question comes first; the system permission prompt only
  // appears after the user has said yes to it.
  const finish = async (allowNotifications) => {
    tap();
    if (name.trim()) await updateProfile({ name: name.trim() });
    if (allowNotifications) {
      setBusy(true);
      await enableNotifications();
      setBusy(false);
    }
    completeOnboarding();
  };

  return (
    <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.screen}>
      <View style={[styles.orb, styles.orbOne]} />
      <View style={[styles.orb, styles.orbTwo]} />

      <View style={[styles.top, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.brand}>
          <MaterialCommunityIcons name="leaf" size={20} color="#fff" />
          <Text style={styles.brandText}>EXAI</Text>
        </View>
        {!last ? (
          <Pressable onPress={() => goTo(SLIDES.length - 1)} hitSlop={10}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s) => (
          <View key={s.key} style={[styles.slide, { width }]}>
            <View style={styles.art}>
              <SlideArt slide={s.key} name={name.trim()} />
            </View>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.text}>{s.text}</Text>
            {s.key === "name" ? (
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="rgba(255,255,255,0.55)"
                style={styles.nameInput}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={24}
                returnKeyType="next"
                onSubmitEditing={next}
              />
            ) : null}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View key={s.key} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Button
          mode="contained"
          onPress={last ? () => finish(true) : next}
          loading={busy}
          disabled={busy}
          buttonColor="#fff"
          textColor="#2C4F68"
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          {last ? "Yes, check in with me" : slide === "name" && !name.trim() ? "Skip for now" : "Next"}
        </Button>
        {last ? (
          <Button mode="text" onPress={() => finish(false)} disabled={busy} textColor="rgba(255,255,255,0.85)" style={styles.notNow}>
            Not now
          </Button>
        ) : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  orb: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.07)" },
  orbOne: { width: 320, height: 320, top: -100, right: -120 },
  orbTwo: { width: 240, height: 240, bottom: 80, left: -120 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg },
  brand: { flexDirection: "row", alignItems: "center", gap: 6 },
  brandText: { ...type.h3, color: "#fff", letterSpacing: 2 },
  skip: { ...type.body, color: "rgba(255,255,255,0.85)", fontFamily: fonts.semibold },
  slide: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  art: { height: 260, alignItems: "center", justifyContent: "center", marginBottom: spacing.xl },
  mockCard: {
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  mockWide: { width: 280, alignItems: "stretch" },
  mockChips: { flexDirection: "row", gap: 6, marginTop: spacing.md },
  mockChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  mockChipText: { ...type.caption, color: "#fff", fontFamily: fonts.semibold },
  mockTitle: { ...type.h3, color: "#fff", marginBottom: spacing.md },
  mockBarRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  mockBarLabel: { ...type.caption, color: "rgba(255,255,255,0.9)", width: 96, marginLeft: 6 },
  mockTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.14)", overflow: "hidden" },
  mockFill: { height: "100%", borderRadius: 4, backgroundColor: "#fff" },
  mockAgree: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  mockAgreeText: { ...type.caption, color: "rgba(255,255,255,0.9)" },
  notifyStack: { width: 300, alignItems: "center" },
  mockNotif: {
    width: 290,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  mockNotifBack: {
    position: "absolute",
    top: -12,
    width: 250,
    height: 60,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  mockNotifHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  mockNotifIcon: {
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: "#3E6B89",
    alignItems: "center",
    justifyContent: "center",
  },
  mockNotifApp: { ...type.caption, color: "#6B7680" },
  mockNotifTitle: { ...type.h3, color: "#1F2A33" },
  mockNotifBody: { ...type.small, color: "#3A4650", marginTop: 2 },
  mockNotifActions: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.sm + 2 },
  mockNotifAction: { ...type.small, color: "#3E6B89", fontFamily: fonts.bold },
  calm: { width: 230, height: 230, alignItems: "center", justifyContent: "center" },
  calmRing: { position: "absolute", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)" },
  calmCore: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...type.h1, color: "#fff", textAlign: "center" },
  text: { ...type.body, color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop: spacing.md },
  nameInput: {
    marginTop: spacing.lg,
    alignSelf: "stretch",
    height: 54,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    color: "#fff",
    fontFamily: fonts.semibold,
    fontSize: 17,
    textAlign: "center",
  },
  bottom: { paddingHorizontal: spacing.lg },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.35)" },
  dotActive: { width: 24, backgroundColor: "#fff" },
  button: { borderRadius: radius.md },
  buttonContent: { paddingVertical: 8 },
  buttonLabel: { fontSize: 16, fontFamily: fonts.bold },
  notNow: { marginTop: spacing.xs },
});
