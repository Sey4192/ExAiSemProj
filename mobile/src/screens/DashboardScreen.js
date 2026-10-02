import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, type } from "../theme/theme";
import { useApp, useRunCheck } from "../context/AppContext";
import GradientHeader from "../components/GradientHeader";
import RiskGauge from "../components/RiskGauge";
import StatTile from "../components/StatTile";
import HistoryItem from "../components/HistoryItem";
import FadeIn from "../components/FadeIn";
import MoodCheck from "../components/MoodCheck";
import { TAB_BAR_SPACE } from "../components/TabBar";
import { ErrorNote, IconBadge, SectionHeader, SurfaceCard } from "../components/Surface";
import { FEATURES, greeting, relativeTime, riskLevel } from "../utils/format";

const TIPS = [
  { icon: "weather-night", text: "Tonight, what if your phone slept outside the bedroom? Notice how tomorrow morning feels." },
  { icon: "bell-sleep-outline", text: "Which app's notifications could you live without today? Try muting just one." },
  { icon: "walk", text: "Next time you feel the pull to scroll, try a two-minute walk first. You can always scroll after." },
  { icon: "timer-outline", text: "Before you open an app, try deciding how long you'll stay. It's easier to stop when you've chosen." },
];

// Dashboard / Usage screen (Chapter 3, Figure 3.2's "View usage statistics"
// use case; wireframe Screen 1). Real on-device usage tracking is future
// work (Chapter 5, Section 5.6), so the stats shown are from the most
// recent session scored by the model rather than live tracking.
export default function DashboardScreen({ navigation }) {
  const { history, profile, updateProfile } = useApp();
  const { run, loading, error, clearError } = useRunCheck(navigation);

  const latest = history[0];
  const tip = useMemo(() => TIPS[new Date().getDate() % TIPS.length], []);

  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const items = history.filter((h) => h.timestamp >= start.getTime());
    const high = items.filter((h) => h.result.risk_label === "high_risk").length;
    return { count: items.length, high, healthy: items.length - high };
  }, [history]);

  const level = latest ? riskLevel(latest.result.risk_probability) : null;
  const input = latest?.result.input;

  const openEntry = (entry) =>
    navigation.navigate(entry.result.risk_label === "high_risk" ? "Alert" : "LowRiskResult", { entry });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <GradientHeader
        eyebrow={new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
        title={greeting(profile.name)}
        rightIcon="cog-outline"
        rightLabel="Settings"
        onRightPress={() => navigation.navigate("Settings")}
      >
        <FadeIn style={styles.heroRow}>
          {latest ? (
            <RiskGauge value={latest.result.risk_probability} size={118} color="#FFFFFF" caption="last check" />
          ) : (
            <View style={styles.emptyRing}>
              <MaterialCommunityIcons name="radar" size={40} color="rgba(255,255,255,0.9)" />
            </View>
          )}
          <View style={styles.heroText}>
            {latest ? (
              <>
                <View style={styles.heroPill}>
                  <View style={[styles.heroDot, { backgroundColor: level.key === "low" ? "#A8E0C1" : "#F6C89A" }]} />
                  <Text style={styles.heroPillText}>{level.label}</Text>
                </View>
                <Text style={styles.heroTitle}>
                  {level.key === "low" ? "You seem balanced today." : "Today's been a lot. Go easy on yourself."}
                </Text>
                <Text style={styles.heroCaption}>Last check-in {relativeTime(latest.timestamp).toLowerCase()}</Text>
              </>
            ) : (
              <>
                <Text style={styles.heroTitle}>How's your day going?</Text>
                <Text style={styles.heroCaption}>Check in whenever you're ready. It only takes a moment.</Text>
              </>
            )}
          </View>
        </FadeIn>
      </GradientHeader>

      <View style={styles.body}>
        <FadeIn index={1} style={styles.tiles}>
          <StatTile
            icon={FEATURES.screen_time_hrs.icon}
            value={input ? FEATURES.screen_time_hrs.format(input.screen_time_hrs) : "—"}
            label="Screen time"
          />
          <StatTile
            icon={FEATURES.frequency.icon}
            value={input ? Math.round(input.frequency) : "—"}
            label="App opens"
            tint={colors.low}
            bg={colors.lowBg}
          />
          <StatTile
            icon={FEATURES.session_duration_min.icon}
            value={input ? FEATURES.session_duration_min.format(input.session_duration_min) : "—"}
            label="Session"
            tint={colors.high}
            bg={colors.highBg}
          />
        </FadeIn>
        <Text style={styles.tilesNote}>
          {input ? "From your last check-in" : "Your numbers will show up after your first check-in"}
        </Text>

        <FadeIn index={2} style={styles.mood}>
          <MoodCheck
            mood={profile.mood}
            onSelect={(key) => updateProfile({ mood: { key, at: Date.now() } })}
            onAction={(to) => navigation.navigate(to)}
          />
        </FadeIn>

        <FadeIn index={3}>
          <SurfaceCard style={styles.cta}>
            <View style={styles.ctaHead}>
              <IconBadge icon="radar" size={44} />
              <View style={{ flex: 1, marginLeft: spacing.md - 4 }}>
                <Text style={styles.ctaTitle}>How's your scrolling going?</Text>
                <Text style={styles.ctaText}>Check in on a session. I'll tell you what I notice, and why.</Text>
              </View>
            </View>
            <Button
              mode="contained"
              icon="hand-wave-outline"
              onPress={() => navigation.navigate("Check")}
              disabled={loading}
              style={styles.ctaButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Check in now
            </Button>
            <Button
              mode="text"
              onPress={() => run()}
              loading={loading}
              disabled={loading}
              style={styles.sampleButton}
              labelStyle={styles.sampleLabel}
            >
              {loading ? "Taking a look…" : "or try a sample session"}
            </Button>
            <ErrorNote message={error} onDismiss={clearError} />
          </SurfaceCard>
        </FadeIn>

        <FadeIn index={4}>
          <SectionHeader title="Your day so far" />
          <SurfaceCard>
            <View style={styles.todayRow}>
              <TodayStat value={today.count} label="Check-ins" color={colors.primary} />
              <View style={styles.todayDivider} />
              <TodayStat value={today.healthy} label="Balanced" color={colors.low} />
              <View style={styles.todayDivider} />
              <TodayStat value={today.high} label="Heavy" color={colors.high} />
            </View>
            <View style={styles.ratioTrack}>
              {today.count ? (
                <>
                  <View style={{ flex: today.healthy, backgroundColor: colors.low }} />
                  <View style={{ flex: today.high, backgroundColor: colors.high }} />
                </>
              ) : null}
            </View>
            <Text style={styles.ratioText}>
              {today.count
                ? today.high === 0
                  ? "Every check-in today has felt balanced. Nice."
                  : `${today.healthy} of ${today.count} check-in${today.count === 1 ? "" : "s"} felt balanced today`
                : "No check-ins yet today, and that's okay"}
            </Text>
          </SurfaceCard>
        </FadeIn>

        <FadeIn index={5}>
          <SectionHeader
            title="Your recent check-ins"
            action={history.length ? "See all" : null}
            onAction={() => navigation.navigate("History")}
          />
          {history.length === 0 ? (
            <SurfaceCard style={styles.emptyCard}>
              <MaterialCommunityIcons name="clock-time-four-outline" size={22} color={colors.textFaint} />
              <Text style={styles.emptyText}>Your check-ins will show up here, so you can look back and notice patterns.</Text>
            </SurfaceCard>
          ) : (
            history.slice(0, 3).map((entry) => <HistoryItem key={entry.id} entry={entry} onPress={() => openEntry(entry)} />)
          )}
        </FadeIn>

        <FadeIn index={6}>
          <SectionHeader title="Something to try today" />
          <SurfaceCard style={styles.tip}>
            <View style={styles.tipIcon}>
              <MaterialCommunityIcons name={tip.icon} size={22} color={colors.low} />
            </View>
            <Text style={styles.tipText}>{tip.text}</Text>
          </SurfaceCard>
        </FadeIn>
      </View>
    </ScrollView>
  );
}

function TodayStat({ value, label, color }) {
  return (
    <View style={styles.todayStat}>
      <Text style={[styles.todayValue, { color }]}>{value}</Text>
      <Text style={styles.todayLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: TAB_BAR_SPACE },
  heroRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.lg },
  emptyRing: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: { flex: 1, marginLeft: spacing.lg },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  heroDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  heroPillText: { ...type.caption, color: "#fff", fontFamily: fonts.bold },
  heroTitle: { ...type.h2, color: "#fff" },
  heroCaption: { ...type.small, color: "rgba(255,255,255,0.8)", marginTop: 4 },

  body: { paddingHorizontal: spacing.lg, marginTop: -spacing.xl },
  tiles: { flexDirection: "row", gap: spacing.sm + 2 },
  tilesNote: { ...type.caption, color: colors.textFaint, marginTop: spacing.sm + 2, textAlign: "center" },

  mood: { marginTop: spacing.lg },
  cta: { marginTop: spacing.md },
  ctaHead: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  ctaTitle: { ...type.h3, color: colors.text },
  ctaText: { ...type.small, color: colors.textMuted, marginTop: 2 },
  ctaButton: { borderRadius: radius.md },
  sampleButton: { marginTop: spacing.xs },
  sampleLabel: { fontFamily: fonts.semibold, fontSize: 14 },
  buttonContent: { paddingVertical: 6 },
  buttonLabel: { fontSize: 15, fontFamily: fonts.bold, letterSpacing: 0 },

  todayRow: { flexDirection: "row", alignItems: "center" },
  todayStat: { flex: 1, alignItems: "center" },
  todayDivider: { width: 1, height: 36, backgroundColor: colors.border },
  todayValue: { ...type.h1 },
  todayLabel: { ...type.caption, color: colors.textMuted },
  ratioTrack: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: colors.background,
    marginTop: spacing.md,
    gap: 3,
  },
  ratioText: { ...type.caption, color: colors.textMuted, marginTop: spacing.sm, textAlign: "center" },

  emptyCard: { flexDirection: "row", alignItems: "center", gap: spacing.md - 4 },
  emptyText: { ...type.small, color: colors.textMuted, flex: 1 },
  tip: { flexDirection: "row", alignItems: "center", gap: spacing.md - 2, backgroundColor: colors.lowBg, borderColor: "transparent" },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  tipText: { ...type.small, color: colors.text, flex: 1 },
});
