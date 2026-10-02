import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, type, fonts } from "../theme/theme";
import { useApp } from "../context/AppContext";
import { getModelMetrics, CONNECTION_HELP } from "../api/client";
import GradientHeader from "../components/GradientHeader";
import RiskGauge from "../components/RiskGauge";
import { ErrorNote, IconBadge, SectionHeader, SurfaceCard } from "../components/Surface";
import { FEATURES, percent, riskLevel } from "../utils/format";
import { TAB_BAR_SPACE } from "../components/TabBar";
import FadeIn from "../components/FadeIn";

const DAY_PARTS = [
  { key: "morning", label: "Morning", icon: "weather-sunset-up", from: 5, to: 12 },
  { key: "afternoon", label: "Afternoon", icon: "white-balance-sunny", from: 12, to: 17 },
  { key: "evening", label: "Evening", icon: "weather-sunset-down", from: 17, to: 22 },
  { key: "night", label: "Night", icon: "weather-night", from: 22, to: 29 },
];

function dayPartOf(hour) {
  const h = hour < 5 ? hour + 24 : hour;
  return DAY_PARTS.find((p) => h >= p.from && h < p.to) || DAY_PARTS[3];
}

const METRIC_INFO = [
  { key: "accuracy", label: "Accuracy", text: "How often I read a session right overall" },
  { key: "precision", label: "Precision", text: "When I say a session is heavy, how often I'm right" },
  { key: "recall", label: "Recall", text: "How many heavy sessions I manage to notice" },
  { key: "f1", label: "F1 score", text: "How well those last two balance out" },
];

// Combines the user's own patterns (from saved checks) with the
// developer-facing "model performance" view from Chapter 3, Figure 3.2.
export default function InsightsScreen() {
  const { history } = useApp();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMetrics(await getModelMetrics());
    } catch {
      setError(CONNECTION_HELP);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const personal = useMemo(() => {
    if (!history.length) return null;
    const probs = history.map((h) => h.result.risk_probability);
    const high = history.filter((h) => h.result.risk_label === "high_risk").length;

    const factorCounts = {};
    for (const h of history) {
      const f = h.result.explanation.top_feature;
      factorCounts[f] = (factorCounts[f] || 0) + 1;
    }
    const topFactor = Object.entries(factorCounts).sort((a, b) => b[1] - a[1])[0];

    const parts = DAY_PARTS.map((p) => {
      const items = history.filter((h) => dayPartOf(h.result.input.hour_of_day).key === p.key);
      const avg = items.length ? items.reduce((s, h) => s + h.result.risk_probability, 0) / items.length : null;
      return { ...p, count: items.length, avg };
    });

    return {
      count: history.length,
      highShare: high / history.length,
      avg: probs.reduce((a, b) => a + b, 0) / probs.length,
      topFactor: topFactor ? { key: topFactor[0], count: topFactor[1] } : null,
      parts,
      recent: history.slice(0, 10).reverse(),
    };
  }, [history]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={false} onRefresh={loadMetrics} />}
    >
      <GradientHeader eyebrow="Insights" title="Your patterns" subtitle="A gentle look back, and how much you can trust what I tell you." compact />

      <View style={styles.body}>
        <FadeIn>
        <SectionHeader title="What I've noticed about you" />
        {!personal ? (
          <SurfaceCard style={styles.row}>
            <IconBadge icon="chart-timeline-variant" size={44} />
            <Text style={[styles.muted, { flex: 1, marginLeft: spacing.md - 4 }]}>
              After a few check-ins, I'll start to notice patterns, like which times of day are hardest for you.
            </Text>
          </SurfaceCard>
        ) : (
          <>
            <SurfaceCard style={styles.row}>
              <RiskGauge
                value={personal.avg}
                size={96}
                stroke={10}
                color={riskLevel(personal.avg).color}
                track={colors.background}
                textColor={colors.text}
                caption="average"
              />
              <View style={{ flex: 1, marginLeft: spacing.lg }}>
                <Text style={styles.bigNumber}>{personal.count}</Text>
                <Text style={styles.muted}>check-ins so far</Text>
                <Text style={[styles.small, { marginTop: spacing.sm }]}>
                  <Text style={{ color: colors.high, fontFamily: fonts.bold }}>{percent(personal.highShare)}</Text> felt heavy
                </Text>
              </View>
            </SurfaceCard>

            <SurfaceCard style={styles.chartCard}>
              <Text style={styles.cardTitle}>Your last {personal.recent.length} check-ins</Text>
              <View style={styles.chart}>
                <View style={styles.midLine} />
                {personal.recent.map((h) => {
                  const lv = riskLevel(h.result.risk_probability);
                  return (
                    <View key={h.id} style={styles.chartCol}>
                      <View style={[styles.chartBar, { height: `${Math.max(6, h.result.risk_probability * 100)}%`, backgroundColor: lv.color }]} />
                    </View>
                  );
                })}
              </View>
              <View style={styles.threshold}>
                <View style={styles.thresholdLine} />
                <Text style={styles.thresholdText}>Above the line means a heavy session</Text>
              </View>
            </SurfaceCard>

            {personal.topFactor && FEATURES[personal.topFactor.key] ? (
              <SurfaceCard style={[styles.row, { marginTop: spacing.sm + 2 }]}>
                <IconBadge icon={FEATURES[personal.topFactor.key].icon} color={colors.high} bg={colors.highBg} size={44} />
                <View style={{ flex: 1, marginLeft: spacing.md - 4 }}>
                  <Text style={styles.cardTitle}>What tends to weigh on you</Text>
                  <Text style={styles.muted}>
                    {FEATURES[personal.topFactor.key].short} came up most, in {personal.topFactor.count} of your {personal.count} check-ins.
                  </Text>
                </View>
              </SurfaceCard>
            ) : null}

            <SurfaceCard style={{ marginTop: spacing.sm + 2 }}>
              <Text style={styles.cardTitle}>When things feel heaviest</Text>
              {personal.parts.map((p) => (
                <View key={p.key} style={styles.partRow}>
                  <MaterialCommunityIcons name={p.icon} size={18} color={colors.textMuted} />
                  <Text style={styles.partLabel}>{p.label}</Text>
                  <View style={styles.partTrack}>
                    {p.avg !== null && (
                      <View style={[styles.partFill, { width: `${Math.max(4, p.avg * 100)}%`, backgroundColor: riskLevel(p.avg).color }]} />
                    )}
                  </View>
                  <Text style={styles.partValue}>{p.avg === null ? "—" : percent(p.avg)}</Text>
                </View>
              ))}
            </SurfaceCard>
          </>
        )}

        </FadeIn>
        <FadeIn index={2}>
        <SectionHeader title="How far should you trust me?" />
        {loading && !metrics ? (
          <SurfaceCard style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </SurfaceCard>
        ) : error && !metrics ? (
          <>
            <ErrorNote message={error} />
            <Button mode="outlined" icon="refresh" onPress={loadMetrics} style={styles.retry}>
              Try again
            </Button>
          </>
        ) : metrics ? (
          <>
            <View style={styles.metricGrid}>
              {METRIC_INFO.map((m) => (
                <SurfaceCard key={m.key} style={styles.metricCard}>
                  <Text style={styles.metricValue}>{percent(metrics.metrics[m.key])}</Text>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                  <View style={styles.metricTrack}>
                    <View style={[styles.metricFill, { width: `${metrics.metrics[m.key] * 100}%` }]} />
                  </View>
                  <Text style={styles.metricText}>{m.text}</Text>
                </SurfaceCard>
              ))}
            </View>

            <SurfaceCard style={{ marginTop: spacing.sm + 2 }}>
              <Text style={styles.cardTitle}>What I pay most attention to</Text>
              <Text style={[styles.muted, { marginBottom: spacing.md }]}>Across all the sessions I learned from</Text>
              {Object.entries(metrics.feature_importances)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => (
                  <View key={k} style={styles.partRow}>
                    <MaterialCommunityIcons name={FEATURES[k]?.icon || "circle-small"} size={18} color={colors.primary} />
                    <Text style={styles.partLabel}>{FEATURES[k]?.short || k}</Text>
                    <View style={styles.partTrack}>
                      <View style={[styles.partFill, { width: `${v * 100 * 2}%`, backgroundColor: colors.primary }]} />
                    </View>
                    <Text style={styles.partValue}>{percent(v)}</Text>
                  </View>
                ))}
            </SurfaceCard>

            <View style={styles.datasetNote}>
              <MaterialCommunityIcons name="database-outline" size={16} color={colors.textMuted} />
              <Text style={styles.datasetText}>
                I learned from {metrics.metrics.n_train.toLocaleString()} sessions and was then tested on{" "}
                {metrics.metrics.n_test.toLocaleString()} I'd never seen (using a Random Forest model). I'm not perfect, so
                trust how you feel, too.
              </Text>
            </View>
          </>
        ) : null}
        </FadeIn>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: TAB_BAR_SPACE },
  body: { paddingHorizontal: spacing.lg },
  row: { flexDirection: "row", alignItems: "center" },
  center: { alignItems: "center", paddingVertical: spacing.xl },
  bigNumber: { ...type.display, color: colors.text },
  muted: { ...type.small, color: colors.textMuted },
  small: { ...type.small, color: colors.text },
  cardTitle: { ...type.h3, color: colors.text, marginBottom: 2 },

  chartCard: { marginTop: spacing.sm + 2 },
  chart: { flexDirection: "row", alignItems: "flex-end", height: 110, gap: 8, marginTop: spacing.md },
  midLine: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "50%",
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.textFaint,
  },
  chartCol: { flex: 1, maxWidth: 30, height: "100%", justifyContent: "flex-end" },
  chartBar: { borderRadius: 8, minHeight: 6 },
  threshold: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm },
  thresholdLine: { width: 16, borderTopWidth: 1, borderStyle: "dashed", borderColor: colors.textFaint, marginRight: 6 },
  thresholdText: { ...type.caption, color: colors.textFaint },

  partRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm + 2 },
  partLabel: { ...type.small, color: colors.text, width: 88, marginLeft: spacing.sm },
  partTrack: { flex: 1, height: 8, backgroundColor: colors.background, borderRadius: 4, overflow: "hidden" },
  partFill: { height: "100%", borderRadius: 4, maxWidth: "100%" },
  partValue: { ...type.caption, color: colors.textMuted, width: 40, textAlign: "right", fontVariant: ["tabular-nums"] },

  retry: { marginTop: spacing.sm, borderRadius: radius.md, alignSelf: "flex-start" },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm + 2 },
  metricCard: { width: "48%", flexGrow: 1, padding: spacing.md },
  metricValue: { ...type.h1, color: colors.text },
  metricLabel: { ...type.small, color: colors.text, fontFamily: fonts.semibold },
  metricTrack: { height: 6, backgroundColor: colors.background, borderRadius: 3, overflow: "hidden", marginVertical: spacing.sm },
  metricFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 3 },
  metricText: { ...type.caption, color: colors.textMuted },

  datasetNote: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, paddingHorizontal: spacing.xs },
  datasetText: { ...type.caption, color: colors.textMuted, flex: 1 },
});
