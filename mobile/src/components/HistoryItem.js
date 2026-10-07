import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, spacing, type, fonts } from "../theme/theme";
import { FEATURES, clockTime, percent, riskLevel } from "../utils/format";
import { SurfaceCard } from "./Surface";

export default function HistoryItem({ entry, onPress, onDelete, style }) {
  const { result } = entry;
  const level = riskLevel(result.risk_probability);
  const top = FEATURES[result.explanation.top_feature];
  const input = result.input;

  return (
    <SurfaceCard onPress={onPress} style={[styles.card, style]} padded={false}>
      <View style={[styles.accent, { backgroundColor: level.color }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.level, { color: level.color }]}>{level.label}</Text>
          <Text style={styles.time}>
            {clockTime(entry.timestamp)}
            {entry.source === "manual" ? "  ·  You entered" : ""}
          </Text>
        </View>
        <Text style={styles.summary} numberOfLines={1}>
          {FEATURES.session_duration_min.format(input.session_duration_min)} on · {FEATURES.screen_time_hrs.format(input.screen_time_hrs)} today
        </Text>
        <View style={styles.factorRow}>
          <MaterialCommunityIcons name={top?.icon || "star-outline"} size={13} color={colors.textMuted} />
          <Text style={styles.factor}>Mostly: {(top?.short || result.explanation.top_feature).toLowerCase()}</Text>
        </View>
      </View>
      <View style={[styles.score, { backgroundColor: level.bg }, onDelete && styles.scoreBeforeDelete]}>
        <Text style={[styles.scoreText, { color: level.color }]}>{percent(result.risk_probability)}</Text>
      </View>
      {onDelete ? (
        <Pressable
          onPress={(e) => {
            e?.stopPropagation?.(); // don't also open the check-in underneath
            onDelete();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Delete this check-in"
          style={({ pressed }) => [styles.delete, pressed && styles.deletePressed]}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", overflow: "hidden", marginBottom: spacing.sm + 2 },
  accent: { width: 4, alignSelf: "stretch" },
  body: { flex: 1, paddingVertical: spacing.md - 2, paddingHorizontal: spacing.md },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  level: { ...type.overline, fontSize: 10 },
  time: { ...type.caption, color: colors.textFaint },
  summary: { ...type.small, color: colors.text, fontFamily: fonts.semibold, marginTop: 4 },
  factorRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  factor: { ...type.caption, color: colors.textMuted },
  score: {
    minWidth: 56,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    paddingHorizontal: 8,
  },
  scoreText: { ...type.h3, fontVariant: ["tabular-nums"] },
  scoreBeforeDelete: { marginRight: spacing.xs },
  delete: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  deletePressed: { backgroundColor: colors.background },
});
